$(window).on('load', () => {

	$("#submit").submit(event => {

		$("#error").hide(1)
		event.preventDefault()
		var formData = $("#submit").serialize()

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