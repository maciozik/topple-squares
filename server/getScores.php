<?php

	// Create directories if not exist.
	if(!is_dir('../data/'))
		mkdir('../data/');

	if(!is_dir('../data/players/'))
		mkdir('../data/players/');

	// Set the path of the directory containing the players data and open it.
	$playersDir = '../data/players/';
	$playersDirRes = opendir($playersDir);

	// The score of each player.
	$playersScores = [];

	// Get the score of each player.
	while($file = readdir($playersDirRes)) {

		if(filetype($playersDir . $file) != 'file' || pathinfo($playersDir . $file)['extension'] != 'txt')
			continue;

		$playerUsername = pathinfo($playersDir . $file)['filename'];
		$playerScore = file($playersDir . $file, FILE_IGNORE_NEW_LINES)[0];

		$playersScores[$playerUsername] = $playerScore;

	}

	// Sort the scores in reverse order.
	arsort($playersScores);

	// Return the scores.
	exit(json_encode($playersScores));

?>