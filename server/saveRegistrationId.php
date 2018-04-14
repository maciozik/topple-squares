<?php

	require 'functions.php';

	// Check the request.
	if(!isset($_POST['username'])
		|| !isset($_POST['gamekey'])
		|| !isset($_POST['registrationid'])
	)
		setStatusCodeAndExit(400);

	// Get data.
	$username = $_POST['username'];
	$gameKey = $_POST['gamekey'];
	$registrationId = $_POST['registrationid'];

	// Check data.
	if(mb_strlen($registrationId) > 255)
		setStatusCodeAndExit(400);

	// Set the path of the file containing the players data.
	$playerFile = '../data/players/' . $username . '.txt';

	// If the player is not registered.
	if(!file_exists($playerFile)):

		setStatusCodeAndExit(401);

	else:

		// If the game key doesn't match.
		if(!isGameKeyMatched($playerFile, $gameKey))
			setStatusCodeAndExit(401);

	endif;

	// Save the registration id.
	file_put_contents($playerFile, PHP_EOL . $registrationId, FILE_APPEND);

	setStatusCodeAndExit(200);

?>