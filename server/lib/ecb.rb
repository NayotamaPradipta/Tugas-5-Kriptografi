require_relative 'base'
require_relative 'puffer_function'
require 'json'
module Puffer
    class Ecb < BaseCipher
        def encrypt(text)
            padded_text = pad(text)
            PufferFunction.initialize_p_array(@key)
            PufferFunction.initialize_s_box(@key)
            total_blocks = padded_text.chars.each_slice(BLOCK_SIZE).map(&:join).size
            encrypted_blocks = padded_text.chars.each_slice(BLOCK_SIZE).map(&:join).each_with_index.map do |block,index|
                block_binary = string_to_binary(block)
                encrypted_binary = PufferFunction.f_function_encrypt(block_binary, key)
                STDERR.puts "Encrypted block #{index+1} of #{total_blocks}"
                encrypted_binary
            end
            return encrypted_blocks.join
        end

        def decrypt(base64_text)
            PufferFunction.initialize_p_array(@key)
            PufferFunction.initialize_s_box(@key)
            binary_data = base64_to_binary(base64_text)
            # puts "BINARY DATA: #{binary_data}"
            total_blocks = binary_data.chars.each_slice(BLOCK_SIZE*8).map(&:join).size
            decrypted_blocks = binary_data.chars.each_slice(BLOCK_SIZE*8).map(&:join).each_with_index.map do |block,index|
                decrypted_binary = PufferFunction.f_function_decrypt(block, key)
                STDERR.puts "Decrypted block #{index+1} of #{total_blocks}"
                decrypted_binary
            end
            return decrypted_blocks.join
        end
    end
end
