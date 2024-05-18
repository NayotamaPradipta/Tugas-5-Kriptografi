require_relative 'base'
require_relative 'puffer_function'
require_relative 'ecb'
require 'json'

begin
  method = ARGV[0]
  text = ARGV[1]
  key = ARGV[2]

  STDERR.puts "Method: #{method}"
  STDERR.puts "Text: #{text}"
  STDERR.puts "Key: #{key}"

  cipher = Puffer::Ecb.new(key)

  result =
    case method
    when 'encrypt'
      cipher.encrypt(text)
    when 'decrypt'
      cipher.decrypt(text)
    else
      raise "Unknown method: #{method}"
    end

  puts result
rescue => e
  STDERR.puts "Error: #{e.message}"
  exit 1
end