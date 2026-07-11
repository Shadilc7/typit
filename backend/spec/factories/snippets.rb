FactoryBot.define do
  factory :snippet do
    title { "MyString" }
    language { "MyString" }
    difficulty { 1 }
    char_count { 1 }
    body { "MyText" }
  end
end
