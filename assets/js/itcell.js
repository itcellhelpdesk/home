    // Initialize AOS
    AOS.init({
      duration: 1000,
      once: true
    });
    
    // Remove preloader when page loads
    window.addEventListener('load', function() {
      document.getElementById('preloader').style.display = 'none';
    });
    
    // Chat widget functionality
    document.getElementById('chatButton').addEventListener('click', function() {
      const chatBox = document.getElementById('chatBox');
      if (chatBox.style.display === 'block') {
        chatBox.style.display = 'none';
      } else {
        chatBox.style.display = 'block';
      }
    });
    
    document.getElementById('chatClose').addEventListener('click', function() {
      document.getElementById('chatBox').style.display = 'none';
    });
    

    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      });
    });
    
    // Navbar background on scroll
    window.addEventListener('scroll', function() {
      const navbar = document.querySelector('.navbar');
      if (window.scrollY > 50) {
        navbar.style.padding = '10px 0';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      } else {
        navbar.style.padding = '15px 0';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      }
    });

  document.getElementById("contactForm").onsubmit = function(e) {
    e.preventDefault(); // Prevent default form submission
    var submitButton = document.getElementById("submitBtn");
    var spinner = document.getElementById("spinner");
    // Show spinner and hide the button
    spinner.style.display = "flex";
    submitButton.style.display = "none";
    var formData = new FormData(this);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://script.google.com/macros/s/AKfycbwU54xzAHcZhDYi_a0nuE6GOqyjPHSTW7-EKwAPnjnP5vT3wNCUzWjF152EEPeMIdrJeA/exec", true);
    xhr.onload = function() {
      // Hide spinner and show the submit button after response
      spinner.style.display = "none";
      submitButton.style.display = "inline-block";
      if (xhr.status == 200) {
        var referenceId = xhr.responseText; // Receive reference ID from the server
        // Show SweetAlert success message with the reference ID
        Swal.fire({
          title: 'Success!',
          html: 'Your submission has been received.<br><br><b>Reference ID:</b> ' + referenceId,
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(function() {
          document.getElementById("contactForm").reset(); // Reset the form after submission
        });
      } else {
        // Error handling if the form submission fails
        Swal.fire({
          title: 'Error!',
          text: 'There was an issue submitting your form. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    };
    xhr.send(formData);
  };
