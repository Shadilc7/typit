class Api::V1::LeaderboardsController < ApplicationController
  def index
    # We want top speeds (highest WPM), filtered optionally by language.
    # We only include results that have a valid Snippet and User.
    
    query = TypingResult.includes(:user, :snippet).order(wpm: :desc).limit(100)
    
    if params[:language].present?
      query = query.joins(:snippet).where(snippets: { language: params[:language].downcase })
    end
    
    # We use Blueprinter to serialize the results (since we added it to Gemfile)
    # But since we haven't created the Blueprint yet, let's just use `as_json` for now
    # or create a basic Blueprinter serializer.
    
    render json: query.as_json(
      only: [:wpm, :accuracy, :created_at, :id],
      include: {
        user: { only: [:username, :is_guest, :id] },
        snippet: { only: [:title, :language, :difficulty, :id] }
      }
    )
  end
end
