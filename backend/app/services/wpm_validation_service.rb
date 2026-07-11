class WpmValidationService
  def initialize(typing_result)
    @typing_result = typing_result
  end

  def validate!
    return unless @typing_result.snippet

    # Calculate expected WPM
    # WPM = (correct characters / 5.0) / elapsed minutes
    elapsed_minutes = @typing_result.time_taken_seconds / 60.0
    
    expected_wpm = if elapsed_minutes > 0.001
                     (@typing_result.correct_chars / 5.0) / elapsed_minutes
                   else
                     0
                   end

    @typing_result.wpm = expected_wpm.round(1)
    
    # Calculate expected accuracy
    # Accuracy = correct keystrokes / total keystrokes
    expected_accuracy = if @typing_result.total_keystrokes > 0
                          (@typing_result.correct_chars.to_f / @typing_result.total_keystrokes) * 100
                        else
                          100.0
                        end
                        
    @typing_result.accuracy = expected_accuracy.round(1)

    # Allow 5% tolerance for floating point / timing differences
    # If the client reported WPM is vastly different, we can flag it later (Phase 4).
    # For now, we trust our server re-computed values and save them.
  end
end
