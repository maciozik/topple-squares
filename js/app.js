(function($){

$(document).ready(function(){

	/**
	 * @type {Object}
	 */
	var app = {

		delay_before_gridSquares_animation: 365,
		gridSquares_AnimationTiming: 350,
		btwEach_gridSquares_animationDelay: 50,

		/**
		 * Init the app.
		 */
		init: function() {

			// Display the best score of the player or save the default value if it is not set.
			if(!localStorage.getItem('best'))
				localStorage.setItem('best', 0);

			// Display the best score of the player.
			$('#best').find('.value').html(localStorage.getItem('best'));

			// Get the score.
			app.getPlayerScore();

			// Display the username.
			if(localStorage.getItem('username'))
				$('.settings-wrapper', '#rules').find('.username').find('span').html(localStorage.getItem('username'));

			// Display the game key.
			if(localStorage.getItem('gamekey'))
				$('.settings-wrapper', '#rules').find('.gamekey').find('span').html(localStorage.getItem('gamekey').toUpperCase());

			// Hide the loader and display the controls screen if the player has not yet played.
			setTimeout(function(){

				if(!localStorage.getItem('best') || parseInt(localStorage.getItem('best'), 10) == 0)
					$('#overlay').addClass('controls').find('.loader').addClass('hide').siblings('div').removeClass('hide');
				else
					$('#overlay').removeClass('show').find('.loader').addClass('hide');

			}, 200);

			// Show the "How to" text if the player has not yet played.
			if(!localStorage.getItem('best') || parseInt(localStorage.getItem('best'), 10) == 0)
				$('#how-to').removeClass('hide');

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

		},

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

					var $square = $('.square', '#grid')
								.find('span:contains(' + i + ')')
								.parents('.square');

					$square.addClass('rotate');

					setTimeout(function(){
						$square.addClass('back')
					}, 90);

					setTimeout(function(){
						$square.removeClass('active right not-found back')
					}, 225);

					if(i == 9) {

						setTimeout(function(){
							$('.square', '#grid').removeClass('rotate');
						}, app.gridSquares_AnimationTiming);

					}

				}, this.btwEach_gridSquares_animationDelay * i, i);

			}

		},

		/**
		 * Save the score in the leaderboard.
		 * @param {str} username The username of the player.
		 */
		saveScore: function(username) {

			var data = {
				username: username,
				gamekey: localStorage.getItem('gamekey'),
				score: parseInt(localStorage.getItem('best'), 10),
				device: 'desktop',
				lang: localStorage.getItem('lang'),
				theme: localStorage.getItem('theme'),
				foundsquaresstyle: 'icons',
				details: localStorage.getItem('details')
			};

			$.ajax({
				url: 'server/saveScore.php',
				type: 'post',
				data: data
			})
			.done(function(data){

				$('form', '#username-modal-box').find('.username').removeClass('error');
				$('form', '#username-modal-box').find('.alert').addClass('hide').filter('.success').removeClass('hide');

				localStorage.setItem('username', username);
				localStorage.setItem('gamekey', data);

				$('.settings-wrapper', '#rules').find('.username').find('span').html(username);
				$('.settings-wrapper', '#rules').find('.gamekey').find('span').html(data.toUpperCase());

				setTimeout(function(){

					$('form', '#username-modal-box').find('.form-buttons').find('.button').removeClass('disabled').removeAttr('disabled');

					// Close the username modal box if displayed.
					if($('#username-modal-box').hasClass('show'))
						$('#username-modal-box').click();

				}, 1000);

			})
			.fail(function(data){

				$('form', '#username-modal-box').find('.form-buttons').find('.button').removeClass('disabled').removeAttr('disabled');

				// Display the gamekey modal box if the username already exists, or else display the error.
				if(data.status === 401) {

					app.username = username;

					$('form', '#gamekey-modal-box').find('.gamekey').focus();

					$('#username-modal-box').removeClass('show');
					$('#gamekey-modal-box').addClass('show');

				} else {

					$('form', '#username-modal-box').find('.username').addClass('error').focus();
					$('form', '#username-modal-box').find('.alert').addClass('hide').filter('.http-' + data.status).removeClass('hide');

				}

			})
			.always(function(data){

				// Get the old score.
				var old_score = (data.responseText !== undefined) ? data.responseText : data;

				// Define the format of the number for displaying the old score.
				var score_format = (localStorage.getItem('lang') == 'en') ? '$1,' : '$1&nbsp;';

				$('form', '#username-modal-box')
					.find('p').filter('.alert').find('span')
					.html(old_score.replace(/(\d)(?=(\d{3})+$)/g, score_format));

			});

		},

		/**
		 * Get the score of all the players.
		 */
		getScores: function() {

			app.getPlayerScore();

			// Hide the old content and display the loader.
			$('.modal-box', '#leaderboard').addClass('loading').find('.leaderboard-content').not('.no-entries').html('');

			$.ajax({
				url: 'server/getScores.php?v=' + Date.now(),
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

					// Whether the player is the current player.
					var isCurrentPlayer = (localStorage.getItem('username') == username) ? true : false;

					// Define the format of the number for displaying the score.
					var score_format = (localStorage.getItem('lang') == 'en') ? '$1,' : '$1&nbsp;';

					// Build the HTML of the entry.
					playersScores_html+= '<div class="entry ' + ((isCurrentPlayer) ? 'active' : '') + '">' +
											'<div class="rank-wrapper">' +
												((rank >= 1 && rank <= 3) ? '<div class="rank rank-' + rank + '">' + rank + '</div>' : rank) +
											'</div>' +
											'<div class="username">' +	username + '</div>' +
											'<div class="score">' + score.replace(/(\d)(?=(\d{3})+$)/g, score_format) + '<span>pts</span></div>' +
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
		 * Get the score of the player.
		 * @param {username}
		 */
		getPlayerScore: function(username) {

			if(!localStorage.getItem('username'))
				return false;

			var username = localStorage.getItem('username');

			$.ajax({

				url: 'server/getPlayerScore.php?v=' + Date.now(),
				type: 'get',
				data: {
					username: username,
					gamekey: localStorage.getItem('gamekey')
				},
				cache: false

			}).done(function(data){

				if(data === '')
					return false;

				if(parseInt(data, 10) > localStorage.getItem('best')) {
					$('#best').find('.value').html(data);
					localStorage.setItem('best', data);
				} else {
					app.saveScore(localStorage.getItem('username'));
				}

			});

		},

		/**
		 * Check the game data entered by the player.
		 * @param {str} username The username previously entered by the player.
		 * @param {str} gameKey The game key entered by the player.
		 */
		checkGameData: function(username, gameKey) {

			$.ajax({

				url: 'server/checkGameData.php?v=' + Date.now(),
				type: 'get',
				data: {
					username: username,
					gamekey: gameKey
				},
				cache: false

			}).done(function(data){

				localStorage.setItem('username', app.username);
				localStorage.setItem('gamekey', gameKey);

				$('.settings-wrapper', '#rules').find('.username').find('span').html(app.username);
				$('.settings-wrapper', '#rules').find('.gamekey').find('span').html(gameKey.toUpperCase());

				$('form', '#gamekey-modal-box').find('.gamekey').removeClass('error');
				$('form', '#gamekey-modal-box').find('.alert').addClass('hide').filter('.success').removeClass('hide');

				setTimeout(function(){

					$('form', '#gamekey-modal-box').find('.form-buttons').find('.button').removeClass('disabled').removeAttr('disabled');

					// Close the gamekey modal box if displayed.
					if($('#gamekey-modal-box').hasClass('show'))
						$('#gamekey-modal-box').click();

					app.getPlayerScore();
					app.resetGridAndTimer();

				}, 1000);

			}).fail(function(data){

				$('form', '#gamekey-modal-box').find('.gamekey').addClass('error').focus();
				$('form', '#gamekey-modal-box').find('.form-buttons').find('.button').removeClass('disabled').removeAttr('disabled');
				$('form', '#gamekey-modal-box').find('.alert').addClass('hide').filter('.http-' + data.status).removeClass('hide');

			});

		},

		/**
		 * Reset the grid and the timer.
		 */
		resetGridAndTimer: function() {

			setTimeout(function(){

				$('html').css('overflow', 'auto');

				app.animateGrid();
				timer.reset();

			}, 200);

		},

		/**
		 * Run a bot to simulate a perfect game.
		 */
		runBot: function() {

			setInterval(function(){

				$.each(game.rightSquares, function(index, square){
					$('.square', '#grid').children('.square-content').find('span').filter(':contains(' + square + ')').click();
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

			}, (app.btwEach_gridSquares_animationDelay * 9 + app.gridSquares_AnimationTiming) * 1000 / timer.time);

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
		 * @param {int} time The time spent to win the round.
		 * @param {int} attempts The number of attempts made to win the round.
		 * @return {int} The points earned.
		 */
		set: function(time, attempts) {

			var points = (timer.time - time) / 10;
				points-= ((attempts - 1) * 200);
				points = Math.ceil(points);

			// Set a minimum number of points if the player didn't earn many.
			if(points < 1500)
				points = 1500;

			this.add(points, false);

			return points;

		},

		/**
		 * Add points to the score.
		 * @param {int}  points
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

			if(this.total > localStorage.getItem('best')) {

				localStorage.setItem('best', this.total);
				localStorage.setItem('details', JSON.stringify(game.currentGame));

				$('#best').addClass('new-best').find('.value').html(this.total);

				// Display the username modal box if it is not saved, or save the new best score directly.
				if(!localStorage.getItem('username')) {

					setTimeout(function(){

						// Define the format of the number for displaying the score.
						var score_format = (localStorage.getItem('lang') == 'en') ? '$1,' : '$1&nbsp;';

						$('html').css('overflow', 'hidden');
						$('#overlay').addClass('show lower-opacity');

						$('#username-modal-box')
							.addClass('show')
							.find('p').not('.alert').find('span')
							.html(localStorage.getItem('best').replace(/(\d)(?=(\d{3})+$)/g, score_format));

						$('form', '#username-modal-box').find('.username').removeClass('error').focus();
						$('form', '#username-modal-box').find('.alert').addClass('hide');
						$('form', '#username-modal-box').find('.form-buttons').find('.button').removeClass('disabled').removeAttr('disabled');

					}, 2000);

					return true;

				} else {

					var username = localStorage.getItem('username');
					app.saveScore(username);

				}

			}

			return false;

		}

	};

	/**
	 * @type {Object}
	 */
	var game = {

		squares: [],
		rightSquares: [],

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
			this.currentGame.rounds = {};
			this.currentGame.rounds.each = [];
			this.currentGame.timestamp = {};
			this.currentGame.timestamp.start = Math.floor(Date.now() / 1000);

			$('#best').removeClass('new-best');

			// Get the 3 random squares.
			this.getRandomSquares();

			// Run the timer.
			timer.run($('#timer').find('span'), $('#progress-bar'));

			// Reset the old score.
			score.reset();

			// app.runBot();

			// Remove points if an attempt is too long.
			this.currentAttempt_interval_id = setInterval(function(){

				if(game.currentAttempt_time > timer.lasted + 4500 & score.total !== 0 & timer.lasted > 500)
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

			this.squares = [];

			this.currentAttempt_time = timer.time;
			this.currentRound_time = timer.time;
			this.currentRound_attempts = [];
			this.currentGame.timestamp.end = Math.floor(Date.now() / 1000);
			this.currentGame.rounds.count = this.rounds - 1;

			this.isGameReady = false;
			this.isGameRunning = false;
			this.areInputsBlocked = true;

			$('#grid').addClass('disabled');
			$('.square', '#grid').removeClass('active');
			$('#rights', '#outputs').removeClass('right');

			// Clear the setInterval() which removes points if an attempt is too long.
			clearInterval(this.currentAttempt_interval_id);

			// Stop the timer.
			timer.stop();

			// Add points to the score as a rounds bonus (+500 points per round won)
			score.add($('#rounds').find('.value').html() * 500, true);

			// Display the rights squares.
			$.each(this.rightSquares, function(id, square){

				$('.square', '#grid')
					.find('span:contains(' + square + ')')
					.parents('.square').addClass('not-found');

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

					// Display the Google Play modal box if necessary.
					if(!localStorage.getItem('googleplay-modal-box') && navigator.userAgent.match(/(android|symbian|symbianos|symbos|netfront|model-orange|javaplatform|samsung|htc|opera mobile|opera mobi|opera mini|presto|huawei|blazer|bolt|doris|fennec|gobrowser|iris|maemo browser|mib|cldc|minimo|semc-browser|skyfire|teashark|teleca|uzard|uzardweb|meego|nokia|playbook)/gi)) {

						localStorage.setItem('googleplay-modal-box', true);

						$('html').css('overflow', 'hidden');
						$('#overlay').addClass('show lower-opacity');
						$('#googleplay-modal-box').addClass('show');

					}

				}, app.btwEach_gridSquares_animationDelay * 9 + app.gridSquares_AnimationTiming);

			}, 3000, mustUsernameModalBoxBeDisplayed);

		},

		/**
		 * Get the 3 random squares.
		 */
		getRandomSquares: function() {

			game.rightSquares = [];

			for(var i=0; i<3; i++) {

				do {
					var square = Math.floor(Math.random() * 9) + 1;
				} while($.inArray(square, game.rightSquares) !== -1);

				game.rightSquares.push(square);

			}

		},

		/**
		 * Save each square selected by the player.
		 * @param {int} square
		 */
		squareSelected: function(square) {

			if(!this.isGameRunning || this.areInputsBlocked)
				return false;

			// If the square was already selected before.
			if($.inArray(square, this.squares) !== -1) {

				$('.square', '#grid')
					.find('span:contains(' + square + ')')
					.parents('.square').removeClass('active');

				this.squares = $.grep(this.squares, function(squareNumber) {
					return squareNumber != square;
				});

				return false;
			}

			$('.square', '#grid')
				.find('span:contains(' + square + ')')
				.parents('.square').addClass('active');

			this.squares.push(square);

			// When 3 squares are selected by the player.
			if(this.squares.length === 3)
				this.checkSquares();

		},

		/**
		 * Check the squares selected by the player.
		 */
		checkSquares: function() {

			var currentAttempt = [];
			this.areInputsBlocked = true;

			// Count the right squares found.
			$.each(this.squares, function(id, square){

				currentAttempt.push(square);

				if($.inArray(square, game.rightSquares) !== -1)
					game.rights++;

			});

			// Remove points when same squares are selected more than once.
			$.each(game.currentRound_attempts, function(id, attempt){

				var nbOf_squaresMatched = 0;

				$.each(currentAttempt, function(id, square){

					if($.inArray(square, attempt) !== -1)
						nbOf_squaresMatched++;

				});

				if(nbOf_squaresMatched === 3) {
					score.sub(500);
					return false;
				}

			});

			this.currentRound_attempts.push(currentAttempt);
			this.updateRights();

			// When the 3 squares are found.
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

			this.squares = [];
			this.rights = 0;
			this.attempts++;
			this.currentAttempt_time = timer.lasted;

			this.updateAttempts();

			// If a new round must be run or not.
			if(shouldNextRoundBeRun) {

				game.nextRound();

			} else {

				// Blink the panel of rights cases as a tip for the player.
				$('#rights', '#outputs').addClass('blink');

				setTimeout(function(){

					$('.square', '#grid').removeClass('active');
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
				var points = score.set(this.currentRound_time - timer.lasted, this.attempts);

				// Save the current round.
				this.saveCurrentRound(
					this.currentRound_time - timer.lasted,
					points,
					this.attempts,
					this.currentRound_attempts,
					this.rightSquares,
					$('.square', '#grid').filter('.active')
				);

				this.rightSquares = [];
				this.attempts = 0;
				this.currentRound_attempts = [];

				$('#grid').addClass('disabled');
				$('.square', '#grid').filter('.active').addClass('right');
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

						// Get the 3 random squares.
						game.getRandomSquares();

						game.areInputsBlocked = false;
						game.currentRound_time = timer.lasted;
						game.updateRights();

					}, app.btwEach_gridSquares_animationDelay * 9 + app.gridSquares_AnimationTiming);

				}, app.delay_before_gridSquares_animation);

			}

			this.updateAttempts();
			this.updateRounds();

			this.rounds++;

		},

		/**
		 * Save the time spent for the current round, the number of the attempts made during this round, the details of each attempt, the right squares, and the squares selected by the user.
		 * @param {int} time
		 * @param {int} points
		 * @param {obj} attempts
		 * @param {arr} currentRound_attempts
		 * @param {arr} rightSquares
		 * @param {obj} $activeSquares
		 */
		saveCurrentRound: function(time, points, attempts, currentRound_attempts, rightSquares, $activeSquares) {

			this.currentGame.rounds.each.push({
				time: time,
				points: points,
				attempts: {
					count: attempts,
					each: currentRound_attempts
				},
				squares: {
					rights: rightSquares,
					displayedAsRights: $.map($activeSquares, function(element){
						return parseInt(element.innerText, 10);
					})
				}
			});

		},

		/**
		 * Update the display of the right squares found for each change.
		 */
		updateRights: function() {

			var rights_html = '';

			if(this.rights === 0) {

				rights_html = '<span class="square-thumb null"></span>';

			} else {

				$.each(new Array(this.rights), function(){
					rights_html+= '<span class="square-thumb"></span>';
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
				setTimeout(function(){
					document.location.reload();
				});

		}

		// If there is no overlay displayed.
		if(!$('#overlay').hasClass('show')) {

			// Enter or space or numeric keys.
			if(key.which == 13 || key.which == 32 || (key.which >= 97 && key.which <= 105)) {

				key.preventDefault();
				game.start();

				// Only numeric keys.
				if(key.which >= 97 && key.which <= 105)
					game.squareSelected(key.which - 96);

			}

		}

	});

	// When the controls screen is pressed.
	$(document).on('click', '#overlay.controls', function(event){

		$(this).removeClass('show controls').children('div').fadeOut(100);

	});

	// When a square is selected.
	$('.square', '#grid').on('click', function() {

		game.start();
		game.squareSelected(parseInt($(this).find('span').html(), 10));

	});

	// When the "Show rules" button or the "See the rules" link is pressed.
	$('#show-rules, #how-to a').on('click', function(event){

		event.preventDefault();

		$('#rules, #overlay').addClass('show').removeClass('lower-opacity');
		$('html').css('overflow', 'hidden');

	});

	// When the rules or the close button of the rules are pressed.
	$('#rules, #rules .close').on('click', function(){

		$('#rules, #overlay').removeClass('show');

		setTimeout(function(){
			$('html').css('overflow', 'auto');
		}, 500);

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

		setTimeout(function(){
			$('.modal-box', '#leaderboard').find('.leaderboard-content').scrollTop(0);
			$('html').css('overflow', 'auto');
		}, 200);

	});

	// When the area outside a modal box, the close button or the later button of modal boxes is pressed.
	$('#username-modal-box, #username-modal-box .close, #username-modal-box .later, #gamekey-modal-box, #gamekey-modal-box .close, #gamekey-modal-box .later, #googleplay-modal-box, #googleplay-modal-box .close').on('click', function(){

		$('#username-modal-box').removeClass('show');
		$('#gamekey-modal-box').removeClass('show');
		$('#googleplay-modal-box').removeClass('show');
		$('#overlay').removeClass('show');

		app.resetGridAndTimer();

	});

	// When the username modal box form is submitted.
	$('form', '#username-modal-box').on('submit', function(event){

		event.preventDefault();

		var username = $(this).find('div').filter(':visible').children('.username').val();

		app.saveScore(username);

		$(this).find('.form-buttons').find('.button').addClass('disabled').attr('disabled', true);

	});

	// When the gamekey modal box form is submitted.
	$('form', '#gamekey-modal-box').on('submit', function(event){

		event.preventDefault();

		var username = app.username;
		var gamekey = $(this).find('div').filter(':visible').children('.gamekey').val();

		app.checkGameData(username, gamekey);

		$(this).find('.form-buttons').find('.button').addClass('disabled').attr('disabled', true);

	});

	// When the settings section or a link on the rules, or a modal box is pressed.
	$('#rules .settings, #rules a, .modal-box', document).on('click', function(event){

		// Stop the propagation to prevent the rules or the modal squares from closing.
		event.stopPropagation();

	});

	// When a button link is pressed.
	$('button, input').filter('.link').on('click', function(){

		var link = $(this).data('href');
		window.open(link, '_blank');

	});

	app.init();

});

})(jQuery);