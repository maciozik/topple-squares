$(document).ready(function() {


	var gridCases_AnimationTiming = 350,
		btwEach_gridCases_animationDelay = 50;


	/* - - - - - - - - - */
	/* F U N C T I O N S */
	/* - - - - - - - - - */

	var timer = {

		id: 0,
		time: 90000,
		lasted: 0,

		container: null,
		progress_bar: null,

		reset_interval_id: 0,

		/**
		 * Run the timer.
		 * @param {obj} $container The container of the digital timer.
		 * @param {obj} $progress_bar The progress bar of the timer.
		 */
		run: function($container, $progress_bar) {

			this.lasted = this.time;
			this.container = $container;
			this.progress_bar = $progress_bar;

			this.id = setInterval(function(){

				if(timer.lasted <= 0)
					game.end();

				timer.update(timer.lasted);
				timer.lasted-= 10;

			}, 10);

		},

		/**
		 * Stop the timer.
		 */
		stop: function() {

			clearInterval(this.id);

			// ...

		},

		/**
		 * Reset the timer.
		 */
		reset: function() {

			// Animate the reset.
			this.reset_interval_id = setInterval(function(){

				timer.lasted+= 1000;

				if(timer.lasted >= timer.time)
					timer.lasted = timer.time;

				timer.update(timer.lasted);

				// Stop the animation when the timer is reset.
				if(timer.lasted === timer.time)
					clearInterval(timer.reset_interval_id);

			}, (btwEach_gridCases_animationDelay * 9 + gridCases_AnimationTiming) * 1000 / timer.time);

		},

		/**
		 * Update the display for each change.
		 * @param {int} lasted The time lasted.
		 */
		update: function(lasted) {

			var time = (lasted / 1000).toFixed(2);
				time = ((lasted < 10000) ? '0' : '') + time;

			this.container.html(time);
			this.progress_bar.css('width', ((lasted / timer.time) * 100) + '%');

		}

	};

	var score = {

		total: 0,

		/**
		 * Set the points earned for each round won.
		 * @param {int} time The time spent to win the round.
		 * @param {int} attempts The number of attempts made to win the round.
		 */
		set: function(time, attempts) {

			var points = (timer.time - time) / 10;
				points-= ((attempts - 1) * 200);
				points = Math.ceil(points);

			if(points < 1500)
				points = 1500;

			this.add(points);

		},

		/**
		 * Add points to the score.
		 * @param {int} points
		 */
		add: function(points) {

			$('.update', '#score')
				.filter('.add').html('+' + points).addClass('show');

			setTimeout(function(){
				$('.update', '#score').html('').removeClass('show');
			}, 400);

			this.total+= points;
			this.update();

		},

		/**
		 * Substract points to the score.
		 * @param {int} points
		 */
		sub: function(points) {

			$('.update', '#score')
				.filter('.sub').html('-' + points).addClass('show');

			setTimeout(function(){
				$('.update', '#score').html('').removeClass('show');
			}, 400);

			this.total-= points;
			this.update();

		},

		/**
		 * Reset the score.
		 */
		reset: function() {

			this.total = 0;
			this.update();

		},

		/**
		 * Save and display the score if it is the best score of the player.
		 */
		saveBest: function() {

			if(!localStorage.getItem('best-score'))
				localStorage.setItem('best-score', 0);

			if(this.total > localStorage.getItem('best-score'))
				localStorage.setItem('best-score', this.total);

			$('#best')
				.find('.value').html(localStorage.getItem('best-score'));

		},

		/**
		 * Update the display for each change.
		 */
		update: function() {

			if(this.total <= 0)
				this.total = 0;

			$('#score')
				.find('.value').html(this.total);

		}

	};

	var game = {

		digits: [],
		rightDigits: [],

		rights: 0,
		attempts: 0,
		rounds: 0,

		currentAttempt_time: timer.time,
		currentAttempt_interval_id: 0,
		currentRound_time: timer.time,
		currentRound_attempts: [],

		areInputsBlocked: false,
		isGameRunning: false,
		isGameReady: true,

		/**
		 * Start a new game.
		 */
		start: function() {

			if(!this.isGameReady || this.isGameRunning || this.areInputsBlocked)
				return false;

			this.isGameRunning = true;
			this.rights = 0;
			this.attempts = 0;
			this.rounds = 0;

			// Get the 3 random digits.
			getRandomDigits();

			// Remove points if an attempt is too long.
			this.currentAttempt_interval_id = setInterval(function(){

				if(game.currentAttempt_time > timer.lasted + 2500)
					score.sub(200);

			}, 1000);

			// Run the timer.
			timer.run($('#timer').find('span'), $('#progress-bar'));

			score.reset();
			this.nextRound();

		},

		/**
		 * End the current game.
		 */
		end: function() {

			this.digits = [];

			this.rights = 0;
			this.attempts = 0;
			this.rounds = 0;

			this.currentAttempt_time = timer.time;
			this.currentRound_time = timer.time;
			this.currentRound_attempts = [];

			this.isGameReady = false;
			this.isGameRunning = false;
			this.areInputsBlocked = true;

			$('div', '#grid').removeClass('active');

			// Clear the setInterval() which removes points if an attempt is too long.
			clearInterval(this.currentAttempt_interval_id);

			// Stop the timer.
			timer.stop();

			// Save the score if it is the best.
			score.saveBest();

			// Display the rights digits.
			$.each(this.rightDigits, function(id, digit){

				$('div', '#grid')
					.find('span:contains(' + digit + ')')
					.parent('div').addClass('not-found');

			});

			// Prepare the next game with the animation.
			setTimeout(function(){

				game.rights = 0;
				game.attempts = 0;
				game.rounds = 0;

				game.animateGrid(btwEach_gridCases_animationDelay);
				timer.reset();

				setTimeout(function(){

					game.isGameReady = true;
					game.areInputsBlocked = false;

				}, btwEach_gridCases_animationDelay * 9 + gridCases_AnimationTiming);

				game.updateRights();
				game.updateAttempts();
				game.updateRounds();

			}, 3000);

		},

		/**
		 * Save each digit selected by the player.
		 * @param {int} digit
		 */
		keyPressed: function(digit) {

			if(!this.isGameRunning || this.areInputsBlocked)
				return false;

			if($.inArray(digit, this.digits) !== -1)
				return false;

			$('div', '#grid')
				.find('span:contains(' + digit + ')')
				.parent('div').addClass('active');

			this.digits.push(digit);

			// When 3 digits are selected by the player.
			if(this.digits.length === 3)
				this.checkDigits();

		},

		/**
		 * Check the digits selected by the player.
		 */
		checkDigits: function() {

			var currentAttempt = [];
			this.areInputsBlocked = true;

			// Count the right digits found.
			$.each(this.digits, function(id, digit){

				currentAttempt.push(digit);

				if($.inArray(digit, game.rightDigits) !== -1)
					game.rights++;

			});

			// Remove points when same digits are selected more than once.
			$.each(game.currentRound_attempts, function(id, attempt){

				var nbOf_digitsMatched = 0;

				$.each(currentAttempt, function(id, digit){

					if($.inArray(digit, attempt) !== -1)
						nbOf_digitsMatched++;

				});

				if(nbOf_digitsMatched === 3) {
					score.sub(500);
					return false;
				}

			});

			this.currentRound_attempts.push(currentAttempt);
			this.updateRights();

			// When the 3 digits are found.
			if(this.rights === 3)
				shouldNextRoundBeRun = true;
			else
				shouldNextRoundBeRun = false;

			this.nextAttempt(shouldNextRoundBeRun);

		},

		/**
		 * Set the next attempt.
		 * @param {bool} shouldNextRoundBeRun Whether the next run should be run or not.
		 */
		nextAttempt: function(shouldNextRoundBeRun) {

			this.digits = [];
			this.rights = 0;
			this.attempts++;
			this.currentAttempt_time = timer.lasted;

			this.updateAttempts();

			// If a new round must be run or not.
			if(shouldNextRoundBeRun) {

				game.nextRound();

			} else {

				setTimeout(function(){

					$('div', '#grid').removeClass('active');
					game.areInputsBlocked = false;

				}, 200);

			}

		},

		/**
		 * Set the next round.
		 */
		nextRound: function() {

			// Between each round (so not for the first round).
			if(this.rounds !== 0) {

				// Set the new score.
				score.set(this.currentRound_time - timer.lasted, this.attempts);

				this.rightDigits = [];
				this.attempts = 0;
				this.currentRound_attempts = [];

				$('div', '#grid').filter('.active').addClass('right');

				// Prepare the next round with the animation.
				setTimeout(function(){

					if(!game.isGameRunning)
						return false;

					game.animateGrid(btwEach_gridCases_animationDelay);
					game.updateRights();

					// When the animation is over.
					setTimeout(function(){

						// Get the 3 random digits.
						getRandomDigits();

						game.areInputsBlocked = false;
						game.currentRound_time = timer.lasted;

					}, btwEach_gridCases_animationDelay * 9 + gridCases_AnimationTiming);

				}, 500);

			}

			this.updateAttempts();
			this.updateRounds();

			this.rounds++;

		},

		/**
		 * Update the display of the right digits found for each change.
		 */
		updateRights: function() {

			var rights_html = '';

			if(this.rights === 0) {

				rights_html = '<span class="case-thumb null"></span>';

			} else {

				$.each(new Array(this.rights), function(){
					rights_html+= '<span class="case-thumb"></span>';
				});

			}

			$('#rights', '#state')
				.find('.value').html(rights_html);

		},

		/**
		 * Update the display of the attempts for each change.
		 */
		updateAttempts: function() {

			$('#attempts', '#state')
				.find('.value').html(this.attempts);

		},

		/**
		 * Update the display of the rounds for each change.
		 */
		updateRounds: function() {

			$('#rounds', '#state')
				.find('.value').html(this.rounds);

		},

		/**
		 * Run the animation of the grid.
		 * @param {int} btwEach_gridCases_animationDelay The delay between each animated cases (in ms).
		 */
		animateGrid: function(btwEach_gridCases_animationDelay) {

			for(let i=1; i<=9; i++) {

				setTimeout(function(){

					$('div', '#grid')
						.find('span:contains(' + i + ')')
						.parent('div').addClass('rotate').removeClass('active right not-found');

						if(i === 9) {

							setTimeout(function(){
								$('div', '#grid').removeClass('rotate');
							}, gridCases_AnimationTiming);

						}

				}, btwEach_gridCases_animationDelay * i);

			}

		}

	};

	/**
	 * Get the 3 random digits.
	 */
	var getRandomDigits = function() {

		game.rightDigits = [];

		for(let i=0; i<3; i++) {

			do {
				var digit = Math.floor(Math.random() * 9) + 1;
			} while($.inArray(digit, game.rightDigits) !== -1);

			game.rightDigits.push(digit);

		}

	}


	/* - - - - - - */
	/* E V E N T S */
	/* - - - - - - */

	// When a key is pressed.
	$(document).on('keydown', function(key) {

		// Enter or space or digit keys.
		if(key.which == 13 || key.which == 32 || (key.which >= 97 && key.which <= 105))
			game.start();

		// Digit keys.
		if(key.which >= 97 && key.which <= 105)
			game.keyPressed(key.which - 96);

	});

	// When a digit is selected by the player.
	$('#grid div').on('click', function() {

		game.start();
		game.keyPressed(parseInt($(this).find('span').html(), 10));

	});

	// When the "Show rules" button is pressed.
	$('input').filter('#show_rules').on('click', function(){

		$('#rules, #overlay').addClass('show');
		$('html, body').css('overflow', 'hidden');

	});

	// When the rules or the close button of the rules are pressed.
	$('#rules, #rules .close').on('click', function(event){

		// Do not close the rules if a link is pressed.
		if(event.target.localName !== 'a') {

			$('#rules, #overlay').removeClass('show');
			$('html, body').css('overflow', 'auto');

		}

	});


	/* - - - - - */
	/* C A L L S */
	/* - - - - - */

	// Display the best score of the player.
	score.saveBest();

});