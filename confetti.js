function confettiFireworks(secs=15) {
    var duration = secs * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const xoffset = 0.2; // towards center

    function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
        return clearInterval(interval);
    }

    var particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3)+xoffset, y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9)-xoffset, y: Math.random() - 0.2 } });
    }, 250);
}

function confettiSchoolPride(secs=15) {
    var end = Date.now() + (secs * 1000);
    const xoffset = 0.15; // towards center
    const yoffset = -0.2; // towards top

    // go Buckeyes!
    var colors = ['#bb0000', '#ffffff'];
    
    (function frame() {
      confetti({
        particleCount: 2,
        angle: 40,
        spread: 50,
        origin: { x: 0 + xoffset, y: 0.5 + yoffset },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 140,
        spread: 50,
        origin: { x: 1 - xoffset, y: 0.5 + yoffset },
        colors: colors
      });
    
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
}

function confettiRealistic(secs=15) {
  var count = 200;
    var defaults = {
      origin: { y: 0.5, x: 0.5 }
    };
    
    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }
    
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
}

function confettiBasic(secs=15) {
  confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5, x: 0.5 }
      });    
}
