<?php
 /*
    Plugin Name: league
    Plugin URI: 
    Description: Plugin for displaying Category
    Author: Gautam
    Author URI: 
    */
session_start();
?>
<?php
/* Custom plugin for Custome assign*/
add_action('admin_menu', 'custom_assign');
function custom_assign(){
	 add_menu_page('Manage league', 'Manage league', 'manage_options', 'assign_order', 'Show_assign_order');
	}



function Show_assign_order(){
	
	include('add_league.php');
	
	}
	
function cmail($tx){
		/*echo "<pre>";
		print_r($tx);
		print_r($_SESSION);
		die;*/
		$_SESSION['available']=0;
		$leagueSession=$_SESSION['legue'];
                $paypalinfo=$_SESSION['paypal'];
                $league=array();
                global $wpdb,$table_prefix;
                    $cdata= $wpdb->get_row("select * from wp_coupons where coupon_code='".$_SESSION['legue']['cocoupon']."' AND coupon_expire >='".date('Y-m-d')."' ");
                    if(!empty($cdata)){
                        $coupon_used=$cdata->coupon_used+1;
                        $wpdb->query("update wp_coupons set coupon_used=".$coupon_used." where  coupon_id=".$coupon_id);
                    }
   $league[8]='Bronze';
   $league[7]='Master';
   $league[6]='Bronze';
   $league[5]='Silver';
   $league[4]='Gold';
   $league[3]='Platinum';
   $league[2]='Diamond';
   $divisionleg=array();
			$divisionleg[26]=$divisionleg[21]=$divisionleg[16]=$divisionleg[10]=$divisionleg[5]='V';
			$divisionleg[25]=$divisionleg[20]=$divisionleg[15]=$divisionleg[9]=$divisionleg[4]='IV';
			$divisionleg[24]=$divisionleg[19]=$divisionleg[14]=$divisionleg[8]=$divisionleg[3]='III';
			$divisionleg[23]=$divisionleg[18]=$divisionleg[13]=$divisionleg[7]=$divisionleg[2]='II';
			$divisionleg[22]=$divisionleg[17]=$divisionleg[12]=$divisionleg[6]=$divisionleg[1]='I';
			$divisionleg[30]=$divisionleg[31]='';
        $currency=explode(';',$_SESSION['legue']['ctl00$cphBody$ucDivisionBoosting1$ddlDesiredCurrency']);                
    $chtml='<table border="1" cellpadding=0 cellspacing=0 >';
     $chtml.='<tr><td style="padding:5px;">Server</td><td style="padding:5px;">NA</td></tr>';
    $chtml.='<tr><td style="padding:5px;">Log in</td><td style="padding:5px;">'.$tx['edd_log_in'].'</td></tr>';
     $chtml.='<tr><td style="padding:5px;">Password</td><td style="padding:5px;">'.$tx['edd_password'].'</td></tr>';
    $chtml.='<tr><td style="padding:5px;">paypal email</td><td style="padding:5px;">'.$paypalinfo['payer_email'].'</td></tr>';
    
    $chtml.='<tr><td style="padding:5px;">First name</td><td style="padding:5px;">'.$tx['firstname'].'</td></tr>';
    $chtml.='<tr><td style="padding:5px;">Last name</td><td style="padding:5px;">'.$tx['lastname'].'</td></tr>';
    $chtml.='<tr><td style="padding:5px;">Email</td><td style="padding:5px;">'.$tx['email'].'</td></tr>';
    
   
  
    
    
    
    
    
    
    $chtml.='<tr><td style="padding:5px;">Transition ID</td><td style="padding:5px;">'.$paypalinfo['payer_id'].'</td></tr>';
   
    $chtml.='<tr><td style="padding:5px;" colspan="2" align="center"><strong>Detail</strong></td></tr>';
    $chtml.='<tr><td style="padding:5px;">Current League</td><td style="padding:5px;">'.$league[$leagueSession['ddlLeagueBoostingCurrentLeague']].'</td></tr>';
    $chtml.='<tr><td style="padding:5px;">Current Division</td><td style="padding:5px;">'.$divisionleg[$leagueSession['ddlLeagueBoostingCurrentDivision']].'</td></tr>';
   $chtml.='<tr><td style="padding:5px;">Current LP</td><td style="padding:5px;">'.$leagueSession['ddlLeagueBoostingCurrentLP'].'</td></tr>';
   $chtml.='<tr><td style="padding:5px;">Desired League</td><td style="padding:5px;">'.$league[$leagueSession['ddlLeagueBoostingDesiredLeague']].'</td></tr>';
    $chtml.='<tr><td style="padding:5px;">Desired Division</td><td style="padding:5px;">'.$divisionleg[$leagueSession['ddlLeagueBoostingDesiredDivision']].'</td></tr>';
   $chtml.='<tr><td style="padding:5px;">Price</td><td style="padding:5px;">'.$currency[0].''.$_SESSION['legue']['ctl00$cphBody$ucDivisionBoosting1$hfPrice'].'</td></tr>';
    $fromEmail='reply@lolepicshop.com';
    $headers = "From: " . strip_tags($fromEmail) . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=ISO-8859-1\r\n";
	$message='<html><body>'.$chtml.'</body></html>';
        $subject='new order - ('.$paypalinfo['payer_id'].')';
         $toEmail=get_option( 'admin_email' );
     mail($toEmail,$subject,$message,$headers);
 //mail('gautamv86@gmail.com',$subject,$message,$headers); 
 mail('chandola.neeraj@gmail.com',$subject,$message,$headers); 
    
     
     $my_postid = 170;//This is page id or post id
$content_post = get_post($my_postid);
$content = $content_post->post_content;
$current_rank=$league[$leagueSession['ddlLeagueBoostingCurrentLeague']].' '.$divisionleg[$leagueSession['ddlLeagueBoostingCurrentDivision']];
$desired_rank=$league[$leagueSession['ddlLeagueBoostingDesiredLeague']].' '.$divisionleg[$leagueSession['ddlLeagueBoostingDesiredDivision']];
 $message=str_ireplace(array("{customer_name}","{customer_login}","{customer_password}","{current_rank}","{desired_rank}"), array( $paypalinfo['first_name'],$tx['edd_log_in'],$tx['edd_password'],$current_rank,$desired_rank),$content);
 	    
      $chtml='Dear '.$paypalinfo['first_name'].'<br/>
thank you for order boosting at lolepicshop<br/>
here is your the log in credential you sent us<br/>

Log in:'.$tx['edd_log_in'].'<br/>
Password:'.$tx['edd_password'].'<br/>

we will finish your order with 3 days to 7 days<br/>
if you have any questions please contact lolepicshop@gmail.com<br/>
Sincerely,<br/>
LoL Epic Shop Team<br/>
';
     
		$fromEmail='reply@lolepicshop.com';
		$headers = "From: " . strip_tags($fromEmail) . "\r\n";
		$headers .= "MIME-Version: 1.0\r\n";
		$headers .= "Content-Type: text/html; charset=ISO-8859-1\r\n";
		$message='<html><body>'.$message.'</body></html>';
		$subject='Thanks for your order - ('.$paypalinfo['payer_id'].')';
		$toEmail=$paypalinfo['payer_email'];
		mail($toEmail,$subject,$message,$headers); 
		mail($tx['email'],$subject,$message,$headers); 
		mail('chandola.neeraj@gmail.com',$subject,$message,$headers); 
}	
function cpaypal(){
	if(isset($_SESSION)){
		session_start();
		
		}
		$_SESSION['available']=0;
		$legue=$_SESSION['legue'];
//$paypal_url = 'https://www.sandbox.paypal.com/cgi-bin/webscr';//'https://www.paypal.com/cgi-bin/webscr';//'https://www.paypal.com/cgi-bin/webscr'; //Test PayPal API URL
//$paypal_id = "maxtest007-facilitator@gmail.com";//get_option('wp_pp_payment_email'); //Business Email
$paypal_url = 'https://www.paypal.com/cgi-bin/webscr';//'https://www.paypal.com/cgi-bin/webscr'; //Test PayPal API URL
$paypal_id = get_option('wp_pp_payment_email'); //Business Email
     
$league=array();
   $league[8]='Bronze';
   $league[7]='Master';
   $league[6]='Bronze';
   $league[5]='Silver';
   $league[4]='Gold';
   $league[3]='Platinum';
   $league[2]='Diamond';
   $currency=explode(';',$_SESSION['legue']['ctl00$cphBody$ucDivisionBoosting1$ddlDesiredCurrency']);
   /*echo "<pre>POSTED";
   print_r($_POST);
   echo "<pre>LEAGE";
   print_r($_SESSION['legue']);
   echo "<pre>CHART";
   print_r($_SESSION['chart']);*/
   $custom = serialize($_SESSION['legue']).'@@@@@'.serialize($_SESSION['chart']);
   $guidstorage = md5(uniqid(rand(), true));
   //global $wpdb;
   mysql_query("INSERT INTO `custom_paypal` (`id`, `data_custom`) VALUES ('".$guidstorage."', '".$custom."')");
   //echo $custom;die;
  ?>
<form action="<?php echo $paypal_url; ?>" method="post" name="cgtm">

        <!-- Identify your business so that you can collect the payments. -->
        <input type="hidden" name="business" value="<?php echo $paypal_id; ?>">
        
        <!-- Specify a Buy Now button. -->
        <input type="hidden" name="cmd" value="_xclick">
        
        <!-- Specify details about the item that buyers will purchase. -->
        <input type="hidden" name="item_name" value="<?php echo $league[$_SESSION['legue']['ddlLeagueBoostingDesiredLeague']]; ?>">
       
        <input type="hidden" name="amount" value="<?php echo $_SESSION['legue']['ctl00$cphBody$ucDivisionBoosting1$hfPrice']; ?>">
        <input type="hidden" name="currency_code" value="<?php echo $currency[0];?>">
        <input type="hidden" name="shipping_1" value="0">
			<input type="hidden" name="country" value="">
			<input type="hidden" name="custom" value="<?php echo $guidstorage; ?>">
        <input type="hidden" name="charset" value="utf-8">
			<input type="hidden" name="rm" value="2">
        <!-- Specify URLs -->
        <input type='hidden' name='cancel_return' value='<?php echo site_url();?>/cancel'>
        <input type='hidden' name='return' value='<?php echo site_url();?>/thanks'>
        <input type="hidden" name="notify_url" value="<?php echo site_url();?>/notify">
        <!-- Display the payment button. -->
       
    
    </form>
<script>
document.forms["cgtm"].submit();
</script>

<?php
		
		
			
}	
	
	
