Rails.application.routes.draw do
  devise_for :users, skip: [:sessions, :registrations, :passwords]
  
  namespace :api do
    namespace :v1 do
      # User info
      get 'me', to: 'users#me'
      patch 'me', to: 'users#update'

      # Guest sessions
      resources :guests, only: [:create]
      
      # Snippets
      resources :snippets, only: [:index, :show]
      
      # Typing Results
      resources :typing_results, only: [:create]
      
      # Leaderboard
      get 'leaderboard', to: 'leaderboards#index'

      # Multiplayer Races
      resources :races, param: :room_code, only: [:create, :show] do
        member do
          post 'join'
        end
      end
    end
  end
  
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
