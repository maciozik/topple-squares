<?php

	require 'functions.php';

	// Check the request.
	if(!isset($_POST['username'])
		|| !isset($_POST['gamekey'])
		|| !isset($_POST['score'])
		|| !isset($_POST['device'])
		|| !isset($_POST['lang'])
		|| !isset($_POST['theme'])
		|| !isset($_POST['foundsquaresstyle'])
		|| !isset($_POST['details'])
	) setStatusCodeAndExit(400);

	// Get data.
	$username = $_POST['username'];
	$gameKey = $_POST['gamekey'];
	$score = intval($_POST['score']);
	$device = $_POST['device'];
	$lang = $_POST['lang'];
	$theme = $_POST['theme'];
	$foundSquaresStyle = $_POST['foundsquaresstyle'];
	$details = $_POST['details'];

	// Check data.
	if(!is_int($score)
		|| $score <= 0
		|| $score > 731500
		|| !preg_match('/^[a-z]{2}$/', $lang)
		|| !preg_match('/^[a-z]{2,10}$/', $theme)
		|| !preg_match('/^[a-z]{2,10}$/', $foundSquaresStyle)
		|| mb_strlen($details) > 8192
	) setStatusCodeAndExit(400);

	// Check the player's username.
	if(!preg_match('/^[a-zA-Z][a-zA-Z0-9_-]{2,23}$/', $username))
		setStatusCodeAndExit(422);

	// Set the path of the file containing the players data.
	$playerFile = '../data/players/' . $username . '.txt';

	// If the player is not registered yet.
	if(!file_exists($playerFile)):

		// Generate the game key.
		$gameKey = array_rand(array_flip(str_split('abcdefghijklmnopqrstuvwxyz')), 6);
		shuffle($gameKey);
		$gameKey = implode('', $gameKey);

	else:

		// If the game key doesn't match.
		if(!isGameKeyMatched($playerFile, $gameKey))
			setStatusCodeAndExit(401);

	endif;

	// Set the player's data and save it.
	$playerData = $score . PHP_EOL . $gameKey . PHP_EOL . $device . PHP_EOL . $lang . PHP_EOL . $theme . PHP_EOL . $foundSquaresStyle . PHP_EOL . $details;
	file_put_contents($playerFile, $playerData);

	setStatusCodeAndExit(201, $gameKey);

?>