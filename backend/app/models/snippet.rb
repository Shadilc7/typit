class Snippet < ApplicationRecord
  before_save :set_char_count

  def char_count
    self[:char_count] || body&.length || 0
  end

  def as_json(options = {})
    json = super(options)
    json['char_count'] = char_count
    json
  end

  private

  def set_char_count
    self.char_count = body.length if body.present?
  end
end
