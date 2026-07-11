class CreateRaces < ActiveRecord::Migration[8.0]
  def change
    create_table :races, id: :uuid do |t|
      t.string :room_code
      t.string :status, default: 'waiting'
      t.references :snippet, null: false, foreign_key: true, type: :uuid
      t.references :host, null: false, foreign_key: { to_table: :users }, type: :uuid
      t.datetime :started_at

      t.timestamps
    end
    add_index :races, :room_code
  end
end
