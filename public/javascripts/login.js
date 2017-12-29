$(window).on('load', () => {

	$('[name="provider"]').click(function() {
		$('[name="provider"]').removeClass('active')
		$(this).addClass('active')
	})

	$("#submit").submit(event => {

		$("#error").hide(1)
		event.preventDefault()
		var formData = $("#submit").serialize()
		formData += "&provider=" + $('[name="provider"].active').attr('id')

		$.post('/', formData, function(resp) {

            if (resp === "OK") {
		        $('body').fadeOut(1000, function(){
		            location.reload(true)
		        })
            }
            else
            	$("#error").html(resp).show(1000)

        })

	})

})