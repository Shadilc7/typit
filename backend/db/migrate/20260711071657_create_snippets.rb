class CreateSnippets < ActiveRecord::Migration[8.0]
  def change
    create_table :snippets, id: :uuid do |t|
      t.string :title
      t.string :language
      t.integer :difficulty
      t.integer :char_count
      t.text :body

      t.timestamps
    end
    add_index :snippets, :language
  end
end
