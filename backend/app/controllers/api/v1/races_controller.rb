class Api::V1::RacesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_race, only: [:show, :join]

  def create
    # Find a random snippet for the race, optionally filtering by difficulty and language
    difficulty = params[:difficulty].presence
    language = params[:language].presence
    snippets = Snippet.all
    snippets = snippets.where(difficulty: difficulty) if difficulty
    snippets = snippets.where(language: language.downcase) if language

    snippet = snippets.order("RANDOM()").first || Snippet.order("RANDOM()").first
    
    race = Race.new(
      snippet: snippet,
      host: current_user,
      status: 'waiting'
    )

    if race.save
      # Automatically add the host as a participant
      race.race_participants.create!(user: current_user)
      
      render json: render_race(race), status: :created
    else
      render json: { errors: race.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    render json: render_race(@race)
  end

  def join
    # Prevent joining if not in waiting status
    unless @race.status == 'waiting'
      return render json: { error: 'Race has already started or finished' }, status: :unprocessable_entity
    end

    participant = @race.race_participants.find_or_initialize_by(user: current_user)
    
    if participant.save
      # In a real ActionCable flow, we'll also broadcast that someone joined.
      render json: render_race(@race)
    else
      render json: { errors: participant.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_race
    @race = Race.find_by!(room_code: params[:room_code].upcase)
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Race not found' }, status: :not_found
  end

  def render_race(race)
    race.as_json(
      include: {
        snippet: { only: [:title, :language, :difficulty, :char_count, :body] },
        host: { only: [:username, :id] },
        race_participants: {
          include: { user: { only: [:username, :id] } }
        }
      }
    )
  end
end
