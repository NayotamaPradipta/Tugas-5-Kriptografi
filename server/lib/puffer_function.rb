module PufferFunction
    # Modul untuk fungsi yang sama untuk semua mode
    BLOCK_SIZE = 16
    def self.f_function_encrypt(block, key)
        # TODO: Initialize P-array, S-boxes with Hexadecimal euler
        #       Implement Key Scheduling Algorithm
        left, right = block[0...64], block[64..-1]
        left = left.to_i(2)
        right = right.to_i(2)
        # XOR Left with P1, XOR Right with P2
        left ^= self.p_array[0]
        right ^= self.p_array[1]

        # Feistel Network 16-round Iterated Cipher
        16.times do |round|
            transform_right = transform(right, key, round)
            new_right = left ^ transform_right
            left = right
            right = new_right
        end

        left = left.to_s(2).rjust(64, '0')
        right = right.to_s(2).rjust(64, '0')
        left + right
    end

    def self.f_function_decrypt(block, key)
        # puts "BLOCK: #{block}"
        left, right = block[0...64], block[64..-1]
        # puts "Left: #{left}"
        # puts "Right: #{right}"
        left = left.to_i(2)
        right = right.to_i(2)

        16.times do |round|
            round = 15 - round
            transform_left = transform(left, key, round)
            new_left = right ^ transform_left
            right = left
            left = new_left
        end

        right ^= self.p_array[1]
        left ^= self.p_array[0]

        left = left.to_s(2).rjust(64, '0')
        right = right.to_s(2).rjust(64, '0')
        left + right
    end


    def self.initialize_s_box(key)
        key_bytes = key.bytes

        s_box_hex_values = [
            "b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfef324e7738926cfbe5f4bf8d8d8c31d763da06c80abb1185eb4f7c7b5757f5958490cfd47d7c19bb42158d9554f7b46bced55c4d79fd5f24d6613c31c3839a2ddf8a9a276bcfbfa1c877c56284dab79cd4c2b3293d20e9e5eaf02ac60acc93ed874422a52ecb238feee5ab6add835fd1a0753d0a8f78e537d2b95bb79d8dcaec642c1e9f23b829b5c2780bf38737df8bb300d01334a0d0bd8645cbfa73a6160ffe393c48cbbbca060f0ff8ec6d31beb5cceed7f2f0bb088017163bc60df45a0ecb1bcd289b06cbbfea21ad08e1847f3f7378d56ced94640d6ef0d3d37be67008e1",
            "86d1bf275b9b241deb64749a47dfdfb96632c3eb061b6472bbf84c26144e49c2d04c324ef10de513d3f5114b8b5d374d93cb8879c7d52ffd72ba0aae7277da7ba1b4af1488d8e836af14865e6c37ab6876fe690b571121382af341afe94f77bcf06c83b8ff5675f0979074ad9a787bc5b9bd4b0c5937d3ede4c3a79396215edab1f57d0b5a7db461dd8f3c75540d00121fd56e95f8c731e9c4d7221bbed0c62bb5a87804b679a0caa41d802a4604c311b71de3e5c6b400e024a6668ccf2e2de86876e4f5c50000f0a93b3aa7e6342b302a0a47373b25f73e3b26d569fe2291ad36d6a147d1060b871a2801f9783764082ff592d9140db1e9399df4b0e14ca8e8",
            "8ee9110b2bd4fa98eed150ca6dd8932245ef7592c703f532ce3a30cd31c070eb36b4195ff33fb1c66c7d70f93918107ce2051fed33f6d1de9491c7dea6a5a442e154c8bb6d8d0362803bc248d414478c2afb07ffe78e89b9feca7e3060c08f0d61f8e36801df66d1d8f9392e52caef0653199479df2be64bbaab008ca8a06fdace9ce70489845a082ba36d611e99f2fbe724246d18b54e335cac0dd1ab9dfd7988a4b0c4558aa119417720b6e150ce2b927d48d7256e445e333cb7572b3bd00fb2746043189cac116cedc7e771ae0358ff752a3a6b6c79a58a9a549b50c5870690755c35e4e36b529038ca733fd1aaa8dab40133d80320e0790968c76546b993",
            "f6c8ff3b2542750da1ffada7b74731782e330ef7d92c43be1ad8c50a8eae20a5556cbdd1f24c99972cb03c73006f5c08a4e220e74abc179151412b1e2dd60a08a11b02e8d70d7d71645833011bf60945507f1a32721ac08aedc2661da91839d146a2a4c425c0ffb87085f9b0e09b94b146a9a4783908f3f267a78c59430485ed89205b36b66a57e756e006522367028287f8c1d695df88c60fe07528fcbe915c7bf23382ea293fa2da1577f9cac299bb7b4beeafef9628c3ebeaf87175c6a1f8bdd07be307fa1bfa9aeff794c19dfc365f447527dea110f4208b941aa7d185380478aa520e3fe2335a322edf147bbdb527aa2ad3cb0f7d6ed381cd6ac35a1d24",
            "bf89b75019605aee9dfaba5cfced033ba2102a0bdbe3b49d7272f89e09d008e5d5bd99239362861eb426297c5841397515473cf2a3d6de58c4bb1b91ad97abf028e9665da4ece80ddc13e0df4322eda0fd389b175e8d10d08c5230a6b576c94fc52b4e74b2e3420e902c82ee7aeb805c2eb76517eabffb8777378c3806c91d07f109d67527c185683448154d6921610755bef30b8027e5e8b04e592e8b2ea354a261eabb48516472d469a66824f24d44b15ce142fcb65307f21cdabbd6858cc7ae3cee06ae64bed91a0412e6f33ba04fab57b8e52165ca81d0c7d118385d6d230a47e1e8b53af0d9a7aac2527b46c4027841aa385a40c6c517af8ed268f46999",
            "0d6dae2b68f62fddb6f303a7598be8d5b71a3a803712c7e6bb1bcbc0c87bea5a8ee3e8e1e8e6eba99c047db5f6e1372796dc2634e56552d80c5fbaf826a9c3dc2c19e9969e2765bf881eea8bf670501f6a39cc95e5359117f9fec0adfb7b959529bd2c7be5db65707c4ca4de869092f0029d9e35246f4953a7e075e5180868fa5bd60a328b3fea53084d174c9de8c8f6a197d66359b69a2292d25f12f1b322392b1035a8158a10f9560ff1927e269bf2a6e1644a5643ca70b2f661e2a3ca134e515e81c62d129ba3b6d66ce3bad95436c15fce6eccd52aad271047def55b084335491f865990c47166611aeddcdc4b807a11be084d85b0efa80bd31f0a021e45",
            "802582d1f605b1ae3e3274ae42535da274f7fed7c5a3869ccdbca58c54dd24986a593f18bb8c42291e7964c993d14cbac363a801a2048d4e3c6f8ecfa75fccd009a649af5ec20c4d7ed78437b46b6aaf5b9db4adf402cf640530118e9852be4203f22cbb68dff2bf38a6eae0b6d0e7bbfe4dd397d42401f61419b1f38c038bd24bad2f3071c2e144721ff72866530e1bc7f6dc9f6217e2585ac3ff7c8fb1e868233d62de85e6df73bfd1c81e4566ce963595022c3b9105642f0729439441bcd983ea5f18e1bccd4ecc56cab4390df6155b21bd8ab7c72f003621b4d18037ace446ec120e5214d1862eb05c6bb57ded789b1d981a31b96a33b3520e76645dce6c",
            "541e0995b7b15ad8008c7d6b9c9095f0563eeffb01de6c4ffda8dbd643fd03ff5c5c5d0afb47e33b41cc9b014db526cae4fd5415f572c4e91813274a4a850e1f633438c15065a3114fedcdcf2b364e81c158ad6018c2261652077e20c4b16a5e07ac791297da1d7f22b93b7bbd5f04bc92a7585dad273c4cde7bc7b67b32a3820a79c7875d14545c6d11f4b0b346fade8ee9ecd09e8e0de1bf709e184ca9093701884f767c72167fe90fc7078439c1be5794bbcc424dbaac1f4d03ec1b37c7d136c49a76c05aeeed73be47b0870e5a51115d34c5dcb74a8101df2b5aaff99e0f073ebf631da29e5b1f748857c1a7c1feae6214f9eb799520e8f140b6c49c2310"
        ]

        @s_boxes = s_box_hex_values.map do |hex_values|
            hex_values.scan(/../).map { |hex_pair| hex_pair.to_i(16) }
        end
        repeat_key = key_bytes.cycle.take(@s_boxes.flatten.length)

        @s_boxes.map!.with_index do |s_box, i|
            s_box.map.with_index do |value, j|
                key_byte = repeat_key[i*256+j]
                value ^ key_byte
            end
        end
    end

    def self.initialize_p_array(key)
        key_bytes = key.bytes

        p_array_hex_values = [
            "674127b6", "891de54f", "d0e45e69", "41625803",
            "d126c395", "0c0dbf72", "b629a9d2", "a6eecf4c",
            "04f4deba", "c84ffb85", "3b81801b", "3d9dbd19",
            "1c0048f3", "c10c1b7c", "035f79e4", "d62712a9",
            "99c5c6a6", "cf47d5c3"
        ]

        @p_array = p_array_hex_values.map { |hex_value| hex_value.to_i(16) }

        repeat_key = key_bytes.cycle.take(@p_array.length * 4)
        @p_array.map!.with_index do |p_element, index|
            key_segment = repeat_key[index*4, 4]
            key_value = key_segment.pack('C*').unpack1('N')
            p_element ^ key_value
        end
    end

    def self.transform(data, key, round)
        # Divide into 8 sections
        # Each section contains 8 bits --> 1 section to 1 S-box
        sections = 8.times.map { |i| (data >> (56 - 8*i)) & 0xFF }
        result = 0
        # S-box lookup
        sections.each_with_index do |section, index|
            s_box_index = (index + round + 2) % @s_boxes.length
            s_box_value = @s_boxes[s_box_index][section]
            permuted_value = permute(s_box_value, key)
            result = (result << 8) | permuted_value
        end
        # puts "Sections: #{sections}"
        # puts "S-BOX: #{@s_boxes}"
        # puts "RESULT: #{result}"
        # puts "P_ARRAY: #{self.p_array[round]}"
        mixed_result = result ^ self.p_array[round+2]

        return mixed_result
    end

    def self.generate_permutation_pattern(key)
        seed = key.bytes.sum
        # puts "KEY BYTES: #{key.bytes}"
        # puts "KEY: #{key}"
        # puts "SEED: #{seed}"
        prng = Random.new(seed)
        pattern = (0...8).to_a
        key_dependent_pattern = pattern.shuffle(random: prng)
        key_dependent_pattern
    end

    def self.permute(section, key)
        permutation_pattern = generate_permutation_pattern(key)
        permuted_section = 0
        permutation_pattern.each_with_index do |new_position, index|
            bit = (section >> index) & 1
            permuted_section |= bit << new_position
        end
        permuted_section
    end

    def self.s_boxes
        @s_boxes
    end

    def self.p_array
        @p_array
    end

end
