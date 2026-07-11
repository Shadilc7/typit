class Api::V1::SnippetsController < ApplicationController
  def index
    language = params[:language]
    
    snippets = if language.present?
                 Snippet.where(language: language.downcase)
               else
                 Snippet.all
               end
    
    # Return a random snippet from the filtered list, or all if none
    snippet = snippets.order("RANDOM()").first || Snippet.order("RANDOM()").first
    
    if snippet
      render json: snippet
    else
      render json: { error: 'No snippets found' }, status: :not_found
    end
  end

  def show
    snippet = Snippet.find(params[:id])
    render json: snippet
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Snippet not found' }, status: :not_found
  end
end
