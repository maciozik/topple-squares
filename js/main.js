$(document).ready(function() {


	var time = 30; // Temps de la partie
	var nbShots = 0; // Nombre d'essai
	var nbSelectCases = 0; // Nombre de cases selectionnées par essai
	var rightCases = [0, 0, 0]; // Cases correctes aléatoires
	var userCases = [0, 0, 0]; // Cases choisies par l'user à chaque essai
	var selectedCase = 0; // Case courante selectionnée par l'user
	var nbRightsUserCases = 0; // Nombre de cases justes trouvées par l'user à chaque essai
	var runningGame = false; // Indique une partie en cours
	var solution = false; // Afficher la solution



	/* Lancement du jeu */

	$(document).keydown(function(key) { // Par 'Enter' ou par les touches numérotées
		if(key.which == 13 || key.which >= 97 && key.which <= 105) {
			$('input#start').click();
		}
	});

	$('input#start').click(function() { // Par clic

		start();

		$('section#matrice #middle > input').show(200).click(function() { // Apparition du bouton et reload au clic
			retry();
		});

	});


	/* Starter */

	function start() {

		$('input#start').hide(200).attr('id', ''); // Suppression du bouton
		$('table tr td').css({ border: '1px solid black', color: 'black' }); // Design de la matrice
		$('aside#infos p').delay(100).show(200); // Affichage des infos
		$('aside#timer').css('color', 'grey'); // Couleur du timer

		runningGame = true; // Partie en cours
		rightCases = aleaCases(); // Choix des 3 cases aléatoires
		timer(); // Lance le timer
		$('footer #progress-bar').animate({ width: 0 }, time*1000 + 1000, 'linear'); // lance la progress-bar

		$(document).keydown(function(key) { // Possibilité de retry avec 'Echap'
				if(key.which == 27) { retry(); }
			});


		/* Solution */

		if(solution) {
			for(l=1; l<=9; l++) {
				for(m=0; m<3; m++) {
					if(Number($('#case' + l).html()) == rightCases[m]) {
						$('#case' + l).css('color', 'rgb(100,200,100)');
					}
				}
			}
		}
	}


	/* Restarter */

	function retry() {
		$('section#matrice #middle > input').hide(200);
		setTimeout("location.reload()", 200);
	}


	/* Changement Background */

		$('table tr td')
			.hover( // Hover/Out sur case
				function() {
					if(runningGame) { // Tant qu'il reste du temps...
						$(this).css({ backgroundColor: 'rgb(240,240,250)' });
					}
				},
				function() {
					if(runningGame) {
						$(this).css({ backgroundColor: 'rgba(0,0,0,0)' });
					}
				}
			)
			.click(function() { // Clic sur case
				if(runningGame) {
					$(this).css({ color: 'orange', fontSize: '130%' });
				}
			})
		;
		$(document).keydown(function(key) {
			if(runningGame) {
				userKey = key.which - 96;
				$('table tr td#case' + userKey).css({ color: 'orange', fontSize: '130%' });
			}
		});


	/* Gestion des actions de choix de l'user */

	$('table tr td').click(function() { // Au clic

		if(runningGame) { // Tant qu'il reste du temps...

			userChoiceGestion($(this).html()); // Valeur de la case cliquée

		}
	});

	$(document).keydown(function(key) { // Au KeyPad

		if(runningGame && key.which >= 97 && key.which <= 105) { // Tant qu'il reste du temps et que la touche entrée est une touche du keyPad...

			userChoiceGestion(key.which - 96); // Valeur de la touche tapée ('-96' pour retrouver les vraies valeurs)

		}
	});


	/* Fonctions */

	function timer() { // Minuteur

		callTimer = setTimeout(timer, 1000);

		if(time >= 10) {
			$('aside#timer p').html(time);
		}
		else if(time < 10 && time > 0) { // Rajout du 0

			$('aside#timer p').html('0' + time);

			if(time <= 5) { // Modification de la couleur du timer et de la progress-bar
				$('aside#timer p').css('color', 'orange');
				$('footer #progress-bar').css('border-top', '5px solid orange')
			}
		}
		else { // Game Over
			runningGame = false;
			lose();
		}

		time--;
	}

	function aleaCases() { // Choix des cases aléatoires

		for(i=0;i<3;i++) { // Les 3 cases aléatoires

			do {
				var potentialAleaCase = Math.floor(Math.random() * 9) + 1; // Choix potentiel de la case
				var duplicatedAleaCase = false; // Variable de test
				for(j=0;j<3;j++) {
					if(rightCases[j] == potentialAleaCase) { // Si la case choisie à déjà été prise...
						duplicatedAleaCase = true;
					}
				}
			} while(duplicatedAleaCase == true); // Rechoisir une nouvelle case aléatoire tant que il y a un doublon

			rightCases[i] = potentialAleaCase; // Rentrer la case dans le tableau final
		}

		return rightCases;
	}

	function userChoiceGestion(selectedCase) { // Gestion des choix de l'user

		var potentialUserCase = selectedCase; // Selection potentielle de la case
		var duplicatedUserCase = false; // Variable de test
		for(j=0;j<3;j++) {
			if(userCases[j] == potentialUserCase) { // Si la case choisie à déjà été prise...
				duplicatedUserCase = true;
			}
		}

		if(duplicatedUserCase == false) { // si la case choisie n'est pas déjà prise...

			userCases[nbSelectCases] = potentialUserCase; // ...on rentre la valeur potentielle dans le tableau
			nbSelectCases++;

			if(nbSelectCases == 3) { // 3 cases selectionnées = 1 essai

				for(i=0;i<3;i++) { // Nombre de cases justes
					for(j=0;j<3;j++) {
						if(userCases[i] == rightCases[j]) {
							nbRightsUserCases++;
						}
					}
				}

				if(nbRightsUserCases == 3) { // L'user gagne...
					runningGame = false;
					win();
				}
				else { // L'user continue...
					if(nbRightsUserCases == 2) { // Choix de la couleur de l'info
						$('aside#infos p:nth-child(2)').css('color', 'orange');
					} else {
						$('aside#infos p:nth-child(2)').css('color', 'orangeRed');
					}
					$('aside#infos p:nth-child(2) span').html(nbRightsUserCases);
					nbRightsUserCases = 0;
					nbSelectCases = 0;
					userCases = [0, 0, 0];
					setTimeout("$('table tr td').css({ color: 'black', fontSize: '100%' })", 200);
				}

				nbShots++;
				$('aside#infos p:last-child span').html(nbShots);
			}
		}
	}

	function win() { // Quand l'user gagne
		$('aside#infos p:nth-child(2)').html('<span>YOU WIN !</span>');
		$('aside:not(#score) p').css('color', 'limeGreen');

		clearTimeout(callTimer); // Arrêt du minuteur
		$('footer #progress-bar').stop(true, false).css('border-top', '5px solid limeGreen'); // Arrêt de la progress-bar et changement de couleur

		$('aside#timer')
			.delay(450).fadeOut(50)
			.delay(450).fadeIn(50)
			.delay(450).fadeOut(50)
			.delay(450).fadeIn(50);

		$('table tr td').css({ color: 'black', fontSize: '100%' })
		$('table tr td#case' + rightCases[0] + ', table tr td#case' + rightCases[1] + ', table tr td#case' + rightCases[2])
			.css({ color: 'white', backgroundColor: 'springGreen' });

		time++;
		var userScore = (time * 5) - ((nbShots-1) * 2); // Définition du score de l'user

		/*
		setTimeout(function() { // Affichage du calcul
			$('aside#score p:first-child').animate({ opacity: 1 }).html('(<span>' + time + '</span> * 5) - ((<span>' + nbShots + '</span>-1) * 3) ='); // Affichage du calcul
		}, 2800);
		*/

		setTimeout(function() { // Affichage du titre 'Score final'
			$('aside#score p:first-child').animate({ opacity: 1 }).html('Final Score :');
		}, 2800);

		setTimeout(function() { // Score animé
			$('aside#score p:last-child').animate({ opacity: 1 });
			var displayedScore = 0;
			animatedScore = setInterval(function() {
				$('aside#score p:last-child').css('color', 'limeGreen').html(displayedScore + '<span>pts</span>');
				displayedScore++;
				if(displayedScore >= userScore + 1 || userScore <= 0) { // Lorsque le score affiché est atteint ou que le score est inférieur à 0...
					clearInterval(animatedScore);
				}
				if(userScore <= 0) { // Si le score est de 0...
					$('aside#score p:last-child').css('color', 'orange');
				}
			}, 10);
		}, 3200);
		setTimeout(function() { // Retry
			$('section#matrice #middle > input').css('color', 'black');
			$(document).keydown(function(key) { // Possibilité de retry avec 'Enter'
				if(key.which == 13 || key.which == 27) { retry(); }
			});
		}, 5000);
	}

	function lose() { // Quand l'user perd
		$('aside#infos p:nth-child(2)').html('<span>YOU LOSE...</span>');
		$('aside p').css('color', 'orangeRed');

		$('aside#timer p')
			.html('00')
			.delay(450).fadeOut(50)
			.delay(450).fadeIn(50)
			.delay(450).fadeOut(50)
			.delay(450).fadeIn(50);

		$('table tr td').css({ border: '1px solid grey', color: 'grey', backgroundColor: 'rgb(245,245,245)', fontSize: '100%' });
		$('table tr td#case' + rightCases[0] + ', table tr td#case' + rightCases[1] + ', table tr td#case' + rightCases[2])
			.css({ color: 'white', backgroundColor: 'rgb(255,200,50)' });

		setTimeout(function() { // Retry
			$('section#matrice #middle > input').css('color', 'black');
			$(document).keydown(function(key) { // Possibilité de retry avec 'Enter'
				if(key.which == 13 || key.which == 27) { retry(); }
			});
		}, 2000);
	}

});