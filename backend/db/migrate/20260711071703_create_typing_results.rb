class CreateTypingResults < ActiveRecord::Migration[8.0]
  def change
    create_table :typing_results, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :snippet, null: false, foreign_key: true, type: :uuid
      t.float :wpm
      t.float :accuracy
      t.float :raw_wpm
      t.integer :total_keystrokes
      t.integer :correct_chars
      t.integer :error_count
      t.float :time_taken_seconds

      t.timestamps
    end
  end
end
