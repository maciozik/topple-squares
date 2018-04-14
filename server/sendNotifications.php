<?php

	define('API_ACCESS_KEY', 'AIzaSyByrJEAKxkNfGgwCvmElwRW95soAsQ-Q9E');

	$registrationIds = [
		"ccadPpZJjfI:APA91bHO_GZh9AHME4-Yf2GO73I8XIeH5CxBaIXfBnYQjNissjywg-S8TI4YYZkeVXAKj3kE69z8gzVYmo0krtzlLHE5xmqJimdU_pQXXQcUh9DpWTFQi2ao6fkprhMT3Q43b4k6xHGv"
	];

	$title = "Push Notification Title";
	$message = "Push Notification Message";

	$data = [
		'title' => $title,
		'message' => $message,
		'vibrate' => 1,
		'sound' => 1
	];

	$fields = [
		'registration_ids' => $registrationIds,
		'data' => $data
	];

	$headers = [
		'Authorization: key=' . API_ACCESS_KEY,
		'Content-Type: application/json'
	];

	$curl = curl_init();

	curl_setopt($curl, CURLOPT_URL, 'https://android.googleapis.com/gcm/send');
	curl_setopt($curl, CURLOPT_POST, true);
	curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($fields));

	$result = curl_exec($curl);

	curl_close($curl);

?>