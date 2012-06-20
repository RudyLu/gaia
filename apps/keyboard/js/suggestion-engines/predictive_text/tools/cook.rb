#!/usr/bin/env ruby

require 'rexml/document'
include REXML

if (ARGV.length < 1)
    puts "usage: cook.rb dictionarySource.txt"
    exit
end

output = File.new("dict.json", 'w')

start = 0

output << '['

File.open(ARGV[0], 'r').each do |record|

	id = record.split("\t")

	freq = Integer(id[1]);
	if (freq >= 10)
		if (start != 0)
			output << ",\n"
		else
			start += 1
		end

		output << '{ "key": "' << id[0]  << '", "value": ' << freq << "}"
	end
end

output << ']'

output.close()

