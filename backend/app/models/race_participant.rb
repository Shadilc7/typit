class RaceParticipant < ApplicationRecord
  belongs_to :race
  belongs_to :user

  validates :user_id, uniqueness: { scope: :race_id, message: "is already in this race" }
end
