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
        current_position: participant.current_position,
        wpm: participant.wpm,
        finished_at: participant.finished_at
      }
    })
  end

  def unsubscribed
    # Only remove participant if race is still waiting.
    # If in progress or finished, keep them in the DB.
    if @race&.status == 'waiting'
      @race.race_participants.find_by(user: current_user)&.destroy
      ActionCable.server.broadcast("race_#{@room_code}", {
        action: 'player_left',
        user_id: current_user.id
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

    # Schedule a background job or just let clients handle the transition to 'in_progress'
    # For simplicity, we just rely on clients to start at the exact started_at time.
    # But we can also update the DB status.
    Thread.new do
      sleep 5
      @race.update(status: 'in_progress') if @race.reload.status == 'countdown'
    end
  end

  def update_progress(data)
    return unless @race.status == 'in_progress' || @race.status == 'countdown'

    participant = @race.race_participants.find_by(user: current_user)
    return unless participant

    participant.update!(current_position: data['current_position'])

    ActionCable.server.broadcast("race_#{@room_code}", {
      action: 'progress_updated',
      user_id: current_user.id,
      current_position: data['current_position']
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
      wpm: temp_result.wpm,
      accuracy: temp_result.accuracy,
      finished_at: Time.current
    )

    ActionCable.server.broadcast("race_#{@room_code}", {
      action: 'player_finished',
      user_id: current_user.id,
      wpm: temp_result.wpm,
      accuracy: temp_result.accuracy
    })

    # If all players are finished, mark race as finished
    if @race.race_participants.where(finished_at: nil).empty?
      @race.update(status: 'finished')
    end
  end
end
