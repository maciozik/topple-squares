(function($){

$(document).ready(function(){

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

		},

		/**
		 * Save the score in the leaderboard.
		 * @param {str}  username 			  The username of the player.
		 * @param {bool} requiresConfirmation Whether the score must be saved with a confirmation or not when the username already exists with a lower score.
		 */
		saveScore: function(username, requiresConfirmation) {

			var data = {
				username: username,
				score: parseInt(localStorage.getItem('best-score'), 10),
				lang: localStorage.getItem('lang'),
				theme: localStorage.getItem('theme'),
				details: JSON.stringify(game.currentGame),
				requiresConfirmation: requiresConfirmation
			};

			$.ajax({
				url: 'server/saveScore.php',
				type: 'post',
				data: data
			})
			.done(function(data){

				$('form', '#username-modal-box').find('.username').removeClass('error');

				// If a confirmation is requested (the username already exists with a lower score).
				if(data !== '') {

					$('form', '#username-modal-box').find('.alert').addClass('hide').filter('.already-exists').removeClass('hide');
					$('form', '#username-modal-box').find('.submit').children('.confirmation').removeClass('hide');
					$('form', '#username-modal-box').find('.submit').children('.validation').addClass('hide');
					$('form', '#username-modal-box').find('.submit').children('[type=submit]').removeClass('disabled').attr('disabled', false);

				} else {

					localStorage.setItem('username', username);

					$('form', '#username-modal-box').find('.alert').addClass('hide').filter('.success').removeClass('hide');

					setTimeout(function(){

						// Close the username modal box if displayed.
						if($('#username-modal-box').hasClass('show'))
							$('#username-modal-box').click();

						// Reload the leaderboard.
						app.getScores();

					}, 1000);

				}

			})
			.fail(function(data){

				var status_code = data.status;

				$('form', '#username-modal-box').find('.username').addClass('error').focus();
				$('form', '#username-modal-box').find('.alert').addClass('hide').filter('.http-' + status_code).removeClass('hide');
				$('form', '#username-modal-box').find('.submit').children('[type=submit]').removeClass('disabled').attr('disabled', false);

			})
			.always(function(data){

				var old_score = (data.responseText !== undefined) ? data.responseText : data;

				$('form', '#username-modal-box')
					.find('p').filter('.alert').find('span')
					.html(old_score);

			});

		},

		/**
		 * Get the score of all the players.
		 */
		getScores: function() {

			// Hide the old content and display the loader.
			$('.modal-box', '#leaderboard').addClass('loading').find('.leaderboard-content').not('.no-entries').html('');

			$.ajax({
				url: 'server/getScores.php',
				type: 'get',
				cache: false
			})
			.done(function(data){

				var playersScores = JSON.parse(data);
				var playersScores_html = '';
				var rank = 1;

				// Display the number of players (not implemented in the final version at the moment).
				$('.players-count', '#show-leaderboard').find('span').html(playersScores.length);

				// If there is no score yet.
				if(playersScores.length == 0) {
					$('.modal-box', '#leaderboard').removeClass('loading');
					return false;
				}

				// Hide the old content.
				$('.modal-box', '#leaderboard').find('.leaderboard-content').removeClass('no-entries').html('');
				$('#best').find('.rank').addClass('hide');

				$.each(playersScores, function(username, score){

					// Add a class to the entry corresponding to the player.
					var active_class = (localStorage.getItem('username') == username) ? 'active' : '';

					// Build the HTML of the entry.
					playersScores_html+= '<div class="entry ' + active_class + '">' +
											'<div class="rank-wrapper">' +
												((rank >= 1 && rank <= 3) ? '<div class="rank rank-' + rank + '">' + rank + '</div>' : rank) +
											'</div>' +
											'<div class="username">' +	username + '</div>' +
											'<div class="score">' + score + ' <span>pts</span></div>' +
										 '</div>';

					// Display the rank of the player next to the best score.
					if(rank >= 1 && rank <= 3 && localStorage.getItem('username') == username)
						$('#best').find('.rank').removeClass('hide').removeClass('rank-1 rank-2 rank-3').addClass('rank-' + rank).html(rank);

					rank++;

				});

				setTimeout(function(){

					// Inject the HTML on the leaderboard and remove the loader.
					$('.modal-box', '#leaderboard').removeClass('loading').find('.leaderboard-content').append(playersScores_html);

					// Get the position of the entry corresponding to the current player.
					var activeEntry_position = $('.modal-box', '#leaderboard').find('.leaderboard-content').children('.entry').filter('.active').position();
					var leaderboardModalBox_height = $('.modal-box', '#leaderboard').outerHeight();

					// Set the scroll on the entry corresponding to the current player.
					if(activeEntry_position !== undefined)
						$('.modal-box', '#leaderboard').find('.leaderboard-content').scrollTop(activeEntry_position.top - (leaderboardModalBox_height / 1.6));

				}, 500);

			});

		},

		/**
		 * Run a bot to simulate a perfect game.
		 */
		runBot: function() {

			setInterval(function(){

				$.each(game.rightBoxes, function(index, box){
					$('.box', '#grid').children('.box-content').find('span').filter(':contains(' + box + ')').click();
				});

			}, 4);

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
		 * @param {obj} $container	  The container of the digital timer.
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
				if(timer.lasted >= timer.time)
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
		 * @param {int} time					 The time spent to win the round.
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
			this.update(800);

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
			this.update(100);

		},

		/**
		 * Reset the score.
		 */
		reset: function() {

			this.total = 0;
			this.update(0);

		},

		/**
		 * Update the display for each change.
		 * @param {int} animationTiming The time the animation of the score must last (in ms), 0 for no animation.
		 */
		update: function(animationTiming) {

			var score_delta = this.total - parseInt($('#score').find('.value').html(), 10);
			var points_toAdd_atEachLoop = Math.ceil(score_delta * 10 / animationTiming);

			if(this.total <= 0)
				this.total = 0;

			// If it must be animated.
			if(animationTiming != 0) {

				var scoreAnimation_interval_id = setInterval(function(){

					var new_score = parseInt($('#score').find('.value').html(), 10) + points_toAdd_atEachLoop;

					if(new_score < 0)
						new_score = score.total;

					$('#score').find('.value').html(new_score);

				}, 10);

				setTimeout(function(){

					clearInterval(scoreAnimation_interval_id);
					$('#score').find('.value').html(score.total);

				}, animationTiming)

			} else
				$('#score').find('.value').html(this.total);

		},

		/**
		 * Save the new best score and display the username modal box if necessary.
		 * @return {bool} Whether the username modal box must be displayed or not.
		 */
		saveBest: function() {

			if(this.total > localStorage.getItem('best-score')) {

				localStorage.setItem('best-score', this.total);
				$('#best').addClass('new-best').find('.value').html(this.total);

				// Display the username modal box if it is not saved, or save the new best score directly.
				if(!localStorage.getItem('username')) {

					setTimeout(function(){

						$('html').css('overflow', 'hidden');
						$('#overlay').addClass('show lower-opacity');
						$('#username-modal-box')
							.addClass('show')
							.find('p').not('.alert').find('span')
							.html(localStorage.getItem('best-score'));

						$('form', '#username-modal-box').find('.username').removeClass('error').focus();
						$('form', '#username-modal-box').find('.alert').addClass('hide');
						$('form', '#username-modal-box').find('.submit').children('.confirmation').addClass('hide');
						$('form', '#username-modal-box').find('.submit').children('.validation').removeClass('hide');
						$('form', '#username-modal-box').find('.submit').children('[type=submit]').removeClass('disabled').attr('disabled', false);

					}, 2000);

					return true;

				} else {

					var username = localStorage.getItem('username');
					app.saveScore(username, false);

				}

			}

			return false;

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
		currentGame: {},

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

			this.currentGame = {};
			this.currentGame.rounds = [];
			this.currentGame.timestamp = {};
			this.currentGame.timestamp.start = Math.floor(Date.now() / 1000);

			$('#best').removeClass('new-best');

			// Get the 3 random boxes.
			this.getRandomBoxes();

			// Run the timer.
			timer.run($('#timer').find('span'), $('#progress-bar'));

			// Reset the old score.
			score.reset();

			// app.runBot();

			// Remove points if an attempt is too long.
			this.currentAttempt_interval_id = setInterval(function(){

				if(game.currentAttempt_time > timer.lasted + 3000)
					score.sub(200);

			}, 1000);

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
			this.currentGame.timestamp.end = Math.floor(Date.now() / 1000);
			this.currentGame.rounds.count = this.rounds - 1;

			this.isGameReady = false;
			this.isGameRunning = false;
			this.areInputsBlocked = true;

			$('#grid').addClass('disabled');
			$('.box', '#grid').removeClass('active');
			$('#rights', '#outputs').removeClass('right');

			// Clear the setInterval() which removes points if an attempt is too long.
			clearInterval(this.currentAttempt_interval_id);

			// Stop the timer.
			timer.stop();

			// Display the rights boxes.
			$.each(this.rightBoxes, function(id, box){

				$('.box', '#grid')
					.find('span:contains(' + box + ')')
					.parents('.box').addClass('not-found');

			});

			// Save the score if it is the best.
			var mustUsernameModalBoxBeDisplayed = score.saveBest();

			// Prepare the next game with the animation.
			setTimeout(function(mustUsernameModalBoxBeDisplayed){

				if(!mustUsernameModalBoxBeDisplayed) {
					app.animateGrid();
					timer.reset();
				}

				setTimeout(function(){

					$('#grid').removeClass('disabled');

					game.isGameReady = true;
					game.areInputsBlocked = false;

				}, app.btwEach_gridBoxes_animationDelay * 9 + app.gridBoxes_AnimationTiming);

			}, 3000, mustUsernameModalBoxBeDisplayed);

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

				// Save the current round.
				this.saveCurrentRound(
					this.currentRound_time - timer.lasted,
					this.attempts,
					this.currentRound_attempts,
					this.rightBoxes,
					$('.box', '#grid').filter('.active')
				);

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
		 * Save the time spent for the current round, the number of the attempts made during this round, the details of each attempt, the right boxes, and the boxes selected by the user.
		 * @param {int} time
		 * @param {obj} attempts
		 * @param {arr} currentRound_attempts
		 * @param {arr} rightBoxes
		 * @param {obj} $activeBoxes
		 */
		saveCurrentRound: function(time, attempts, currentRound_attempts, rightBoxes, $activeBoxes) {

			this.currentGame.rounds.push({
				time: time,
				attempts: {
					count: attempts,
					each: currentRound_attempts
				},
				boxes: {
					rights: rightBoxes,
					displayedAsRights: $.map($activeBoxes, function(element){
						return parseInt(element.innerText, 10);
					})
				}
			});

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

		// Escape key.
		if(key.which == 27) {

			// If the controls screen, the rules or a modal box are displayed, close the content.
			if($('#overlay').hasClass('controls'))
				$('#overlay').click();

			else if($('#rules').hasClass('show'))
				$('.close', '#rules').click();

			else if($('#username-modal-box').hasClass('show'))
				$('.close', '#username-modal-box').click();

			else if($('#leaderboard').hasClass('show'))
				$('.close', '#leaderboard').click();

			// Or else, reload the document.
			else
				location.reload();

		}

		// If there is no overlay displayed.
		if(!$('#overlay').hasClass('show')) {

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

	// When the controls screen is pressed.
	$(document).on('click', '#overlay.controls', function(event){

		$(this).removeClass('show controls').children('div').fadeOut(100);

	});

	// When a box is selected by the player.
	$('.box', '#grid').on('click', function() {

		game.start();
		game.keyPressed(parseInt($(this).find('span').html(), 10));

	});

	// When the "Show rules" button is pressed.
	$('button').filter('#show-rules').on('click', function(){

		$('#rules, #overlay').addClass('show').removeClass('lower-opacity');
		$('html').css('overflow', 'hidden');

	});

	// When the rules or the close button of the rules are pressed.
	$('#rules, #rules .close').on('click', function(){

		$('#rules, #overlay').removeClass('show');
		$('html').css('overflow', 'auto');

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

	// When the "Leaderboard" button is pressed.
	$('button').filter('#show-leaderboard').on('click', function(){

		$('#leaderboard, #overlay').addClass('show').filter('#overlay').addClass('lower-opacity');
		$('html').css('overflow', 'hidden');

		app.getScores();

	});

	// When the area outside the leaderboard modal box or the close button of the modal box is pressed.
	$('#leaderboard, #leaderboard .close').on('click', function(){

		$('#leaderboard, #overlay').removeClass('show');
		$('html').css('overflow', 'auto');

		setTimeout(function(){
			$('.modal-box', '#leaderboard').find('.leaderboard-content').scrollTop(0);
		}, 200);

	});

	// When the area outside the username modal box or the close button of the modal box is pressed.
	$('#username-modal-box, #username-modal-box .close').on('click', function(){

		$('#username-modal-box, #overlay').removeClass('show');
		$('html').css('overflow', 'auto');

		setTimeout(function(){
			app.animateGrid();
			timer.reset();
		}, 200);

	});

	// When the username modal box form is submitted.
	$('form', '#username-modal-box').on('submit', function(event){

		event.preventDefault();

		var username = $(this).find('div').filter(':visible').children('.username').val();

		if($(this).find('.submit').children('.validation').hasClass('hide'))
			app.saveScore(username, false);
		else
			app.saveScore(username, true);

		$(this).find('.submit').children('[type=submit]').addClass('disabled').attr('disabled', true);

	});

	// When the settings section or a link on the rules, or a modal box is pressed.
	$('#rules .settings, #rules a, .modal-box', document).on('click', function(event){

		// Stop the propagation to prevent the rules or the modal boxes from closing.
		event.stopPropagation();

	});

	// When a button link is pressed.
	$('button').filter('.link').on('click', function(){

		var link = $(this).data('href');
		window.open(link, '_blank');

	});


	/* - - - -  - - - */
	/* I N I T  A P P */
	/* - - - -  - - - */

	// Display the best score of the player or save the default value if it is not set.
	if(!localStorage.getItem('best-score'))
		localStorage.setItem('best-score', 0);

	$('#best').find('.value').html(localStorage.getItem('best-score'));

	// Get the leaderboard.
	app.getScores();

	// Hide the loader and display the controls screen if the player has not yet played.
	setTimeout(function(){

		if(!localStorage.getItem('best-score') || parseInt(localStorage.getItem('best-score'), 10) == 0)
			$('#overlay').addClass('controls').find('.loader').addClass('hide').siblings('div').removeClass('hide');
		else
			$('#overlay').removeClass('show').find('.loader').addClass('hide');

	}, 200);

	// Display the game in the language of the player or save the default value if it is not set.
	if(!localStorage.getItem('lang'))
		localStorage.setItem('lang', 'en');

	else if(localStorage.getItem('lang') != 'en')
		app.changeLanguage(localStorage.getItem('lang'));

	// Display the game with the theme selected by the player or save the default value if it is not set.
	if(!localStorage.getItem('theme'))
		localStorage.setItem('theme', 'light');

	else if(localStorage.getItem('theme') != 'light')
		app.changeTheme(localStorage.getItem('theme'));

});

})(jQuery);