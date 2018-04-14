<?php

	require 'functions.php';

	// Check the request.
	if(!isset($_GET['username'])
		|| !isset($_GET['gamekey'])
	) setStatusCodeAndExit(400);

	// Get data.
	$username = $_GET['username'];
	$gameKey = $_GET['gamekey'];

	// Set the path of the directory containing the players data and open it.
	$playersDir = '../data/players/';
	$playerFile = $playersDir . $username . '.txt';

	// If the player is not registered.
	if(!file_exists($playerFile)):

		setStatusCodeAndExit(401);

	else:

		// If the game key doesn't match.
		if(!isGameKeyMatched($playerFile, $gameKey))
			setStatusCodeAndExit(401);

	endif;

	// Get the score.
	$playerScore = file($playerFile, FILE_IGNORE_NEW_LINES)[0];

	setStatusCodeAndExit(200, $playerScore);

?>