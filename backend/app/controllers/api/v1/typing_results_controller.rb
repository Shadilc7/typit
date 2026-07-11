class Api::V1::TypingResultsController < ApplicationController
  before_action :authenticate_user!

  def create
    @typing_result = current_user.typing_results.build(typing_result_params)
    
    # Server-side validation
    WpmValidationService.new(@typing_result).validate!

    if @typing_result.save
      render json: @typing_result, status: :created
    else
      render json: { errors: @typing_result.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def typing_result_params
    params.require(:typing_result).permit(
      :snippet_id, 
      :raw_wpm, 
      :total_keystrokes, 
      :correct_chars, 
      :error_count, 
      :time_taken_seconds
    )
  end
end
