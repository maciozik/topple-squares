<?php

	// Set the path of the directory containing the players data and open it.
	$playersDir = '../data/players/';
	$playersDirRes = opendir($playersDir);

	// The score of each player.
	$playersScores = [];

	// Get the score of each player.
	while($file = readdir($playersDirRes)) {

		if(filetype($playersDir . $file) != 'file' || pathinfo($playersDir . $file)['extension'] != 'txt')
			continue;

		// if(pathinfo($playersDir . $file)['filename'] == 'maciozik')
		// 	continue;

		$playerUsername = pathinfo($playersDir . $file)['filename'];
		$playerScore = file($playersDir . $file, FILE_IGNORE_NEW_LINES)[0];

		$playersScores[$playerUsername] = $playerScore;

	}

	// Sort the scores in reverse order.
	arsort($playersScores);

	// Return the scores.
	exit(json_encode($playersScores));

?>