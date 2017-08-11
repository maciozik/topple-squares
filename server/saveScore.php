<?php

	/**
	 * Set the status code of the document and exit the script with the data if exist.
	 * @param statusCode $statusCode
	 * @param data $data
	 */
	function setStatusCodeAndExit($statusCode, $data = '') {
		http_response_code($statusCode);
		exit($data);
	}

	// Check the request.
	if(!isset($_POST['username'])
		|| !isset($_POST['score'])
		|| !isset($_POST['lang'])
		|| !isset($_POST['theme'])
		|| !isset($_POST['details'])
		|| !isset($_POST['requiresConfirmation'])
	) setStatusCodeAndExit(400);

	// Get data.
	$username = $_POST['username'];
	$score = intval($_POST['score']);
	$lang = $_POST['lang'];
	$theme = $_POST['theme'];
	$details = $_POST['details'];
	$requiresConfirmation = $_POST['requiresConfirmation'];

	// Check data.
	if(!is_int($score)
		|| $score <= 0
		|| $score > 621000
		|| !preg_match('/^[a-z]{2}$/', $lang)
		|| !preg_match('/^[a-z]{2,10}$/', $theme)
		|| mb_strlen($details) > 8192
	) setStatusCodeAndExit(403);

	// Check the player's username.
	if(!preg_match('/^[a-zA-Z][a-zA-Z0-9_-]{2,23}$/', $username))
		setStatusCodeAndExit(422);

	// Create directories if not exist.
	if(!is_dir('../data/'))
		mkdir('../data/');

	if(!is_dir('../data/players/'))
		mkdir('../data/players/');

	// Set the path of the directory containing the players data.
	$playersDir = '../data/players/' . $username . '.txt';

	// Check username conflicts.
	if(file_exists($playersDir)):

		$old_record = intval(explode(PHP_EOL, file_get_contents($playersDir))[0]);

		// Do not save if the old record is higher than the new score.
		if($score < $old_record)
			setStatusCodeAndExit(409, strval($old_record));

		// Ask a confirmation before overwritting the old record.
		if($requiresConfirmation == 'true')
			setStatusCodeAndExit(200, strval($old_record));

	endif;

	// Set the player's data and save it.
	$playerData = $score . PHP_EOL . $lang . PHP_EOL . $theme . PHP_EOL . $details;
	$scoreboard = file_put_contents($playersDir, $playerData);

	setStatusCodeAndExit(200);

?>