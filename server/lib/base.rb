require 'base64'
module Puffer
    class BaseCipher 
        attr_reader :key 

        BLOCK_SIZE = 16 # 16 bytes / 128 bits

        def initialize(key)
            if key.bytesize < BLOCK_SIZE
                @key = key.ljust(BLOCK_SIZE, "\x00")
            elsif key.bytesize > BLOCK_SIZE
                @key = key.byteslice(0, BLOCK_SIZE)
            else 
                @key = key 
            end
        end 

        def encrypt(data)
            raise NotImplementedError, 'Subclass must implement the encryption method'
        end 

        def decrypt(data)
            raise NotImplementedError, 'Subclass must implement the decryption method'
        end 

        private 

        def pad(data)
            # Add padding if text block is less than 128 bit
            # Use PKCS#7
            padding_size = BLOCK_SIZE - (data.bytesize % BLOCK_SIZE)
            padding_size = BLOCK_SIZE if padding_size == 0
            padding = padding_size.chr(Encoding::ASCII_8BIT) * padding_size
            data + padding 
        end

        def string_to_binary(str)
            # Returns binary string
            str.bytes.map { |b| b.to_s(2).rjust(8, '0')}.join
        end
        
        def binary_to_string(binary)
            [binary].pack('B*')
        end

        def base64_to_binary(str)
            binary = Base64.strict_decode64(str)
            return string_to_binary(binary)
        end

    end 
end