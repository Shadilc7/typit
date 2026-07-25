class RaceChannel < ApplicationCable::Channel
  def subscribed
    @room_code = params[:room_code]
    return reject unless @room_code.present?

    @race = Race.find_by(room_code: @room_code)
    return reject unless @race

    stream_from "race_#{@room_code}"

    # Add user to race if not already there
    participant = @race.race_participants.find_or_create_by!(user: current_user)

    # Broadcast player joined
    ActionCable.server.broadcast("race_#{@room_code}", {
      action: 'player_joined',
      participant: {
        id: participant.id,
        user_id: current_user.id,
        username: current_user.username,
        is_host: @race.host_id == current_user.id,
        current_position: participant.current_position || 0,
        wpm: participant.wpm || 0,
        finished_at: participant.finished_at
      }
    })
  end

  def unsubscribed
    if @race
      @race.reload rescue nil
      username = current_user&.username || 'A player'

      if @race&.status == 'waiting'
        @race.race_participants.find_by(user: current_user)&.destroy
      end

      ActionCable.server.broadcast("race_#{@room_code}", {
        action: 'player_left',
        user_id: current_user&.id,
        username: username
      })
    end
  end

  def start_race
    return unless @race.host_id == current_user.id
    return unless @race.status == 'waiting'

    # Start countdown. Synchronized start time is 5 seconds from now.
    started_at = Time.current + 5.seconds
    @race.update!(status: 'countdown', started_at: started_at)

    ActionCable.server.broadcast("race_#{@room_code}", {
      action: 'race_starting',
      started_at: started_at.iso8601
    })

    # Use Rails executor to handle background thread safely
    race_id = @race.id
    Thread.new do
      Rails.application.executor.wrap do
        sleep 5
        race = Race.find_by(id: race_id)
        race&.update(status: 'in_progress') if race&.status == 'countdown'
      end
    end
  end

  def rematch
    return unless @race.host_id == current_user.id

    new_snippet = Snippet.order("RANDOM()").first || @race.snippet
    started_at = Time.current + 5.seconds

    @race.update!(
      snippet: new_snippet,
      status: 'countdown',
      started_at: started_at
    )
    @race.race_participants.update_all(current_position: 0, wpm: 0, finished_at: nil)

    snippet_json = {
      title: new_snippet.title,
      language: new_snippet.language,
      difficulty: new_snippet.difficulty,
      char_count: new_snippet.char_count,
      body: new_snippet.body
    }

    ActionCable.server.broadcast("race_#{@room_code}", {
      action: 'race_restarted',
      started_at: started_at.iso8601,
      snippet: snippet_json
    })

    race_id = @race.id
    Thread.new do
      Rails.application.executor.wrap do
        sleep 5
        race = Race.find_by(id: race_id)
        race&.update(status: 'in_progress') if race&.status == 'countdown'
      end
    end
  end

  def update_progress(data)
    @race.reload rescue nil
    return unless @race && (%w[in_progress countdown].include?(@race.status))

    participant = @race.race_participants.find_by(user: current_user)
    return unless participant

    new_pos = data['current_position'].to_i
    wpm = data['wpm'] ? data['wpm'].to_f : participant.wpm
    accuracy = data['accuracy'] ? data['accuracy'].to_f : participant.accuracy

    participant.update!(current_position: new_pos, wpm: wpm, accuracy: accuracy)

    ActionCable.server.broadcast("race_#{@room_code}", {
      action: 'progress_updated',
      user_id: current_user.id,
      current_position: new_pos,
      wpm: wpm,
      accuracy: accuracy
    })
  end

  def finish_race(data)
    participant = @race.race_participants.find_by(user: current_user)
    return unless participant

    # Re-validate WPM server-side
    temp_result = TypingResult.new(
      snippet: @race.snippet,
      user: current_user,
      total_keystrokes: data['total_keystrokes'],
      correct_chars: data['correct_chars'],
      error_count: data['error_count'],
      time_taken_seconds: data['time_taken_seconds']
    )
    
    WpmValidationService.new(temp_result).validate!

    participant.update!(
      current_position: @race.snippet.char_count,
      wpm: temp_result.wpm,
      accuracy: temp_result.accuracy,
      finished_at: Time.current
    )

    ActionCable.server.broadcast("race_#{@room_code}", {
      action: 'player_finished',
      user_id: current_user.id,
      current_position: @race.snippet.char_count,
      wpm: temp_result.wpm,
      accuracy: temp_result.accuracy,
      finished_at: Time.current.iso8601
    })

    # If all players are finished, mark race as finished
    if @race.race_participants.where(finished_at: nil).empty?
      @race.update(status: 'finished')
    end
  end
end

