class CreateRaceParticipants < ActiveRecord::Migration[8.0]
  def change
    create_table :race_participants, id: :uuid do |t|
      t.references :race, null: false, foreign_key: true, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.integer :current_position, default: 0
      t.float :wpm
      t.float :accuracy
      t.datetime :finished_at

      t.timestamps
    end
  end
end
