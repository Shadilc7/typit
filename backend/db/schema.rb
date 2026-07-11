# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_07_11_075312) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "race_participants", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "race_id", null: false
    t.uuid "user_id", null: false
    t.integer "current_position", default: 0
    t.float "wpm"
    t.float "accuracy"
    t.datetime "finished_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["race_id"], name: "index_race_participants_on_race_id"
    t.index ["user_id"], name: "index_race_participants_on_user_id"
  end

  create_table "races", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "room_code"
    t.string "status", default: "waiting"
    t.uuid "snippet_id", null: false
    t.uuid "host_id", null: false
    t.datetime "started_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["host_id"], name: "index_races_on_host_id"
    t.index ["room_code"], name: "index_races_on_room_code"
    t.index ["snippet_id"], name: "index_races_on_snippet_id"
  end

  create_table "snippets", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "title"
    t.string "language"
    t.integer "difficulty"
    t.integer "char_count"
    t.text "body"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["language"], name: "index_snippets_on_language"
  end

  create_table "typing_results", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "snippet_id", null: false
    t.float "wpm"
    t.float "accuracy"
    t.float "raw_wpm"
    t.integer "total_keystrokes"
    t.integer "correct_chars"
    t.integer "error_count"
    t.float "time_taken_seconds"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["snippet_id"], name: "index_typing_results_on_snippet_id"
    t.index ["user_id"], name: "index_typing_results_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "email", default: ""
    t.string "encrypted_password", default: ""
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "username"
    t.string "guest_token"
    t.boolean "is_guest", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true, where: "(is_guest = false)"
    t.index ["guest_token"], name: "index_users_on_guest_token", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "race_participants", "races"
  add_foreign_key "race_participants", "users"
  add_foreign_key "races", "snippets"
  add_foreign_key "races", "users", column: "host_id"
  add_foreign_key "typing_results", "snippets"
  add_foreign_key "typing_results", "users"
end
