FactoryBot.define do
  factory :race_participant do
    race { nil }
    user { nil }
    current_position { 1 }
    wpm { 1.5 }
    accuracy { 1.5 }
    finished_at { "2026-07-11 12:56:01" }
  end
end
