jQuery(document).ready(function(jQuery){
		
			viewCart();

			if (jQuery(location).attr('pathname') == "/checkout/") {
				setInterval(function(){ viewCart() }, 500);
				// Modifies frame size based on cart amount
                if(sendOwl.cartItemCount() > 1) {
                      const frame = jQuery('.cart iframe');
                      frame.height(frame.height + 78);
                 } 
			}

			jQuery('body').on('click', '.ptp-button', function(event) {
			    event.preventDefault();
				addToCart(jQuery(this));  
			});
			
			function addToCart(product) {
				let id;
				let key;
				url = product.attr('href');
				urlf = url.split("&");
				if(urlf[0] == "?add_to_cart"){
					id = urlf[1].replace("id=", '');
					key = urlf[2].replace("key=", '');
					sendOwl.addProductToCart(id, key, function(data) {
						if (data.status == "ok") {
							viewCart();
							let text = product.text();
							product.text("ADDED TO CART!");
							setTimeout(function(){ product.text(text) }, 2000);
						} else {
							if (data.message == "multiple_currencies_not_permitted") {
								let text = product.text();
								product.text("ERROR: Multiple Currencies!");
								setTimeout(function(){ product.text(text) }, 3000);	
							} else {
								product.text("ERROR: TRY AGAIN");	
							}					
						}
					});	
				}
			}

			function viewCart() {
				let el = jQuery('a[href="/checkout"]');
				let cartAmount = sendOwl.cartItemCount();
				if (cartAmount > 0) {
					el.html("View Cart" + " <span class='cart' style='color: #e5d0a9;'>(" + cartAmount + ")</span>");
				} else {
					el.html("View Cart");
				}
				console.log("Cart Count:" + cartAmount);
			}

})