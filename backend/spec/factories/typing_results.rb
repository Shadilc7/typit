FactoryBot.define do
  factory :typing_result do
    user { nil }
    snippet { nil }
    wpm { 1.5 }
    accuracy { 1.5 }
    raw_wpm { 1.5 }
    total_keystrokes { 1 }
    correct_chars { 1 }
    error_count { 1 }
    time_taken_seconds { 1.5 }
  end
end
