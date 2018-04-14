<?php

	require 'functions.php';

	// Check the request.
	if(!isset($_GET['username'])
		|| !isset($_GET['gamekey'])
	) setStatusCodeAndExit(400);

	// Get data.
	$username = $_GET['username'];
	$gameKey = $_GET['gamekey'];

	// Set the path of the file containing the players data.
	$playerFile = '../data/players/' . $username . '.txt';

	// If the player is not registered.
	if(!file_exists($playerFile)):

		setStatusCodeAndExit(403);

	else:

		// If the game key doesn't match.
		if($gameKey != '000000' && !isGameKeyMatched($playerFile, $gameKey))
			setStatusCodeAndExit(401);

	endif;

	setStatusCodeAndExit(200);

?>