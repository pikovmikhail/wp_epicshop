jQuery(document).ready(function($){var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src='https://embed.tawk.to/5577684f4a8e13613c754c21/default';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);$(".button-collapse").sideNav({draggable:true});$('.tooltipped').tooltip({delay:50});$('select').material_select();$('.modal-trigger').leanModal();$('#user-button').dropdown({belowOrigin:true,alignment:'left',constrain_width:false});$('#tasks-button').dropdown({belowOrigin:true,constrain_width:false});$('#notifications-button').dropdown({belowOrigin:true,constrain_width:false});var notifications=[{"username":"System Admin","time":"5 Minutes Ago","message":"Notifications will be displayed here in a future update. Check back soon!"}];$.each(notifications,function(index,notification){$("#notifications-dropdown").append('<li>'+
'<span class="left"><b>'+notification.username+'</b></span>'+
'<span class="right">'+notification.time+'</span>'+
'<span class="left">'+notification.message+'</span>'+
'</li>'+
'<li class="divider"></li>')});});