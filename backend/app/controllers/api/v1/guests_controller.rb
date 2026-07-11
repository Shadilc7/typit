class Api::V1::GuestsController < ApplicationController
  def create
    user = User.create!(is_guest: true, username: "Guest_#{SecureRandom.hex(4)}")
    
    render json: {
      guest_token: user.guest_token,
      username: user.username,
      id: user.id
    }, status: :created
  end
end
