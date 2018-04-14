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

	/**
	 * Check if the game key match with the username.
	 * @param str $playerFile The path to the game file of the player.
	 * @param str $gameKey The game key provided.
	 * @return bool
	 */
	function isGameKeyMatched($playerFile, $gameKey) {

		// Get the game key
		$registeredGameKey = file($playerFile, FILE_IGNORE_NEW_LINES)[1];

		// If the game key doesn't match.
		if(strtolower(trim($registeredGameKey)) !== strtolower(trim($gameKey)))
			return false;

		return true;

	}

?>