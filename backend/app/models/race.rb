class Race < ApplicationRecord
  belongs_to :snippet
  belongs_to :host, class_name: 'User'
  has_many :race_participants, dependent: :destroy
  has_many :users, through: :race_participants

  validates :room_code, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[waiting countdown in_progress finished] }

  before_validation :generate_room_code, on: :create

  private

  def generate_room_code
    self.room_code ||= SecureRandom.alphanumeric(6).upcase
  end
end
