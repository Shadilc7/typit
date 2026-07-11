class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :typing_results, dependent: :destroy

  validates :username, presence: true, uniqueness: true, allow_nil: true
  validates :guest_token, uniqueness: true, allow_nil: true

  before_validation :generate_guest_token, if: :is_guest?

  # Override Devise email requirement for guests
  def email_required?
    !is_guest?
  end

  def password_required?
    !is_guest?
  end

  private

  def generate_guest_token
    self.guest_token ||= SecureRandom.uuid
  end
end
