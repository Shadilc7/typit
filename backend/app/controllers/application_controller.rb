class ApplicationController < ActionController::API
  private

  def authenticate_user!
    token = request.headers['Authorization']&.split(' ')&.last
    
    if token.present?
      @current_user = User.find_by(guest_token: token) || User.find_by(id: token) # Or any other auth mechanism
    end

    unless @current_user
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end
end
