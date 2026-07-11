class ChangeEmailIndexOnUsers < ActiveRecord::Migration[8.0]
  def change
    remove_index :users, :email
    # Only enforce uniqueness of email for non-guest users
    add_index :users, :email, unique: true, where: "is_guest = false"
  end
end
