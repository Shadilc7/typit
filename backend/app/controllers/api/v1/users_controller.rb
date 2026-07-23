class Api::V1::UsersController < ApplicationController
  before_action :authenticate_user!

  def me
    render json: {
      id: current_user.id,
      username: current_user.username,
      is_guest: current_user.is_guest
    }
  end
  def update
    if current_user.username == user_params[:username]
      render json: {
        id: current_user.id,
        username: current_user.username,
        is_guest: current_user.is_guest
      }
      return
    end

    if current_user.update(user_params)
      render json: {
        id: current_user.id,
        username: current_user.username,
        is_guest: current_user.is_guest
      }
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:username)
  end
end
