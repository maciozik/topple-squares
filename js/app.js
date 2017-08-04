$(document).ready(function(){


	/* - - - - - - - */
	/* O B J E C T S */
	/* - - - - - - - */

	/**
	 * @type {Object}
	 */
	var app = {

		gridBoxes_AnimationTiming: (500 - 150),
		btwEach_gridBoxes_animationDelay: 50,

		/**
		 * Change the language of the application.
		 * @param {str} lang
		 */
		changeLanguage: function(lang) {

			$('html').attr('lang', lang);

		},

		/**
		 * Change the theme of the application.
		 * @param {str} theme
		 */
		changeTheme: function(theme) {

			// Change the value of the toggle
			$('.settings', '#rules').find('.theme')
				.attr('data-theme-toggle', ((theme == 'light') ? 'dark' : 'light'));

			// Change the elements for the theme.
			$('*', document).filter('[data-theme]').addClass('hide')
			$('*', document).filter('[data-theme=' + theme + ']').removeClass('hide');

			// Change the theme of the application.
			$('link', 'head').filter('.app-theme').attr('href', 'css/app-' + theme + '.css');

		},

		/**
		 * Run the animation of the grid.
		 */
		animateGrid: function() {

			for(var i=1; i<=9; i++) {

				setTimeout(function(i){

					var $box = $('.box', '#grid')
								.find('span:contains(' + i + ')')
								.parents('.box');

					$box.addClass('rotate');

					setTimeout(function(){
						$box.addClass('back')
					}, 90);

					setTimeout(function(){
						$box.removeClass('active right not-found back')
					}, 225);

					if(i == 9) {

						setTimeout(function(){
							$('.box', '#grid').removeClass('rotate');
						}, app.gridBoxes_AnimationTiming);

					}

				}, this.btwEach_gridBoxes_animationDelay * i, i);

			}

		}

	};

	/**
	 * @type {Object}
	 */
	var timer = {

		id: 0,
		time: 90000,
		lasted: 0,

		container: null,
		progress_bar: null,

		reset_interval_id: 0,

		/**
		 * Run the timer.
		 * @param {obj} $container    The container of the digital timer.
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

			}, (app.btwEach_gridBoxes_animationDelay * 9 + app.gridBoxes_AnimationTiming) * 1000 / timer.time);

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

	/**
	 * @type {Object}
	 */
	var score = {

		total: 0,

		/**
		 * Set the points earned for each round won.
		 * @param {int} time     The time spent to win the round.
		 * @param {int} attempts The number of attempts made to win the round.
		 */
		set: function(time, attempts) {

			var points = (timer.time - time) / 10;
				points-= ((attempts - 1) * 200);
				points = Math.ceil(points);

			// Set a minimum number of points if the player didn't earn many.
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

			if(this.total > localStorage.getItem('best-score')) {
				localStorage.setItem('best-score', this.total);
				$('#best').addClass('new-best');
			}

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

	/**
	 * @type {Object}
	 */
	var game = {

		boxes: [],
		rightBoxes: [],

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

			// Get the 3 random boxes.
			this.getRandomBoxes();

			$('#best').removeClass('new-best');

			// Remove points if an attempt is too long.
			this.currentAttempt_interval_id = setInterval(function(){

				if(game.currentAttempt_time > timer.lasted + 2500)
					score.sub(200);

			}, 1000);

			// Run the timer.
			timer.run($('#timer').find('span'), $('#progress-bar'));

			score.reset();

			this.updateRights();
			this.updateAttempts();
			this.updateRounds();
			this.nextRound();

		},

		/**
		 * End the current game.
		 */
		end: function() {

			this.boxes = [];

			this.currentAttempt_time = timer.time;
			this.currentRound_time = timer.time;
			this.currentRound_attempts = [];

			this.isGameReady = false;
			this.isGameRunning = false;
			this.areInputsBlocked = true;

			$('#grid').addClass('disabled');
			$('.box', '#grid').removeClass('active');

			// Clear the setInterval() which removes points if an attempt is too long.
			clearInterval(this.currentAttempt_interval_id);

			// Stop the timer.
			timer.stop();

			// Save the score if it is the best.
			score.saveBest();

			// Display the rights boxes.
			$.each(this.rightBoxes, function(id, box){

				$('.box', '#grid')
					.find('span:contains(' + box + ')')
					.parents('.box').addClass('not-found');

			});

			// Prepare the next game with the animation.
			setTimeout(function(){

				app.animateGrid();
				timer.reset();

				setTimeout(function(){

					$('#grid').removeClass('disabled');

					game.isGameReady = true;
					game.areInputsBlocked = false;

				}, app.btwEach_gridBoxes_animationDelay * 9 + app.gridBoxes_AnimationTiming);

			}, 3000);

		},

		/**
		 * Get the 3 random boxes.
		 */
		getRandomBoxes: function() {

			game.rightBoxes = [];

			for(var i=0; i<3; i++) {

				do {
					var box = Math.floor(Math.random() * 9) + 1;
				} while($.inArray(box, game.rightBoxes) !== -1);

				game.rightBoxes.push(box);

			}

		},

		/**
		 * Save each box selected by the player.
		 * @param {int} box
		 */
		keyPressed: function(box) {

			if(!this.isGameRunning || this.areInputsBlocked)
				return false;

			if($.inArray(box, this.boxes) !== -1)
				return false;

			$('.box', '#grid')
				.find('span:contains(' + box + ')')
				.parents('.box').addClass('active');

			this.boxes.push(box);

			// When 3 boxes are selected by the player.
			if(this.boxes.length === 3)
				this.checkBoxes();

		},

		/**
		 * Check the boxes selected by the player.
		 */
		checkBoxes: function() {

			var currentAttempt = [];
			this.areInputsBlocked = true;

			// Count the right boxes found.
			$.each(this.boxes, function(id, box){

				currentAttempt.push(box);

				if($.inArray(box, game.rightBoxes) !== -1)
					game.rights++;

			});

			// Remove points when same boxes are selected more than once.
			$.each(game.currentRound_attempts, function(id, attempt){

				var nbOf_boxesMatched = 0;

				$.each(currentAttempt, function(id, box){

					if($.inArray(box, attempt) !== -1)
						nbOf_boxesMatched++;

				});

				if(nbOf_boxesMatched === 3) {
					score.sub(500);
					return false;
				}

			});

			this.currentRound_attempts.push(currentAttempt);
			this.updateRights();

			// When the 3 boxes are found.
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

			this.boxes = [];
			this.rights = 0;
			this.attempts++;
			this.currentAttempt_time = timer.lasted;

			this.updateAttempts();

			// If a new round must be run or not.
			if(shouldNextRoundBeRun) {

				game.nextRound();

			} else {

				// Blink the panel of rights cases as tip during one round for new players
				if(parseInt(localStorage.getItem('best-score'), 10) == 0 && game.rounds <= 1)
					$('#rights', '#outputs').addClass('blink');

				setTimeout(function(){

					$('.box', '#grid').removeClass('active');
					$('#rights', '#outputs').removeClass('blink');

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

				this.rightBoxes = [];
				this.attempts = 0;
				this.currentRound_attempts = [];

				$('#grid').addClass('disabled');
				$('.box', '#grid').filter('.active').addClass('right');
				$('#rights', '#outputs').addClass('right');

				// Prepare the next round with the animation.
				setTimeout(function(){

					if(!game.isGameRunning)
						return false;

					app.animateGrid();

					// When the animation is over.
					setTimeout(function(){

						$('#grid').removeClass('disabled');
						$('#rights', '#outputs').removeClass('right');

						// Get the 3 random boxes.
						game.getRandomBoxes();

						game.areInputsBlocked = false;
						game.currentRound_time = timer.lasted;
						game.updateRights();

					}, app.btwEach_gridBoxes_animationDelay * 9 + app.gridBoxes_AnimationTiming);

				}, 500);

			}

			this.updateAttempts();
			this.updateRounds();

			this.rounds++;

		},

		/**
		 * Update the display of the right boxes found for each change.
		 */
		updateRights: function() {

			var rights_html = '';

			if(this.rights === 0) {

				rights_html = '<span class="box-thumb null"></span>';

			} else {

				$.each(new Array(this.rights), function(){
					rights_html+= '<span class="box-thumb"></span>';
				});

			}

			$('#rights', '#outputs')
				.find('.value').html(rights_html);

		},

		/**
		 * Update the display of the attempts for each change.
		 */
		updateAttempts: function() {

			$('#attempts', '#outputs')
				.find('.value').html(this.attempts);

		},

		/**
		 * Update the display of the rounds for each change.
		 */
		updateRounds: function() {

			$('#rounds', '#outputs')
				.find('.value').html(this.rounds);

		}

	};


	/* - - - - - - */
	/* E V E N T S */
	/* - - - - - - */

	// When a key is pressed.
	$(document).on('keydown', function(key) {

		// Escape.
		if(key.which == 27) {

			// If the rules are displayed or not
			if($('#rules').hasClass('show'))
				$('.close', '#rules').click();
			else
				location.reload();

		}

		// If the rules are not displayed
		if(!$('#rules').hasClass('show')) {

			// Enter or space or numeric keys.
			if(key.which == 13 || key.which == 32 || (key.which >= 97 && key.which <= 105)) {

				key.preventDefault();
				game.start();

				// Only numeric keys.
				if(key.which >= 97 && key.which <= 105)
					game.keyPressed(key.which - 96);

			}

		}

	});

	// When a box is selected by the player.
	$('.box', '#grid').on('click', function() {

		game.start();
		game.keyPressed(parseInt($(this).find('span').html(), 10));

	});

	// When the "Show rules" button is pressed.
	$('button').filter('#show_rules').on('click', function(){

		$('#rules, #overlay').addClass('show');
		$('html').css('overflow', 'hidden');

	});

	// When the rules or the close button of the rules are pressed.
	$('#rules, #rules .close').on('click', function(event){

		$('#rules, #overlay').removeClass('show');
		$('html').css('overflow', 'auto');

	});

	// When the settings section or a link on the rules is pressed.
	$('.settings, a', '#rules').on('click', function(event){

		// Stop the propagation to prevent the rules from closing.
		event.stopPropagation();

	});

	// When the language button is pressed.
	$('.settings', '#rules').find('.language').on('click', function(event){

		event.preventDefault();

		var lang = $(this).attr('data-lang-toggle');
		localStorage.setItem('lang', lang);

		app.changeLanguage(lang);

	});

	// When the theme button is pressed.
	$('.settings', '#rules').find('.theme').on('click', function(event){

		event.preventDefault();

		var theme = $(this).attr('data-theme-toggle');
		localStorage.setItem('theme', theme);

		app.changeTheme(theme);

	});

	// When a button link is clicked.
	$('button').filter('.link').on('click', function(){

		var link = $(this).data('href');
		window.open(link, '_blank');

	});


	/* - - - -  - - - */
	/* I N I T  A P P */
	/* - - - -  - - - */

	// Display the best score of the player.
	score.saveBest();

	// Display the game in the language of the player
	if(localStorage.getItem('lang')) {

		var lang = localStorage.getItem('lang');

		if(lang != 'en')
			app.changeLanguage(lang);

	}

	// Display the game with the theme selected by the player
	if(localStorage.getItem('theme')) {

		var theme = localStorage.getItem('theme');

		if(theme != 'light')
			app.changeTheme(theme);

	}

});