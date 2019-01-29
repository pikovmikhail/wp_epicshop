<?php
//error_reporting(E_ALL);
session_start();
include_once('wp-config.php');
include_once('wp-load.php');
include_once('wp-includes/wp-db.php');
$package = trim($_REQUEST['package']);
global $wpdb,$table_prefix;
$data= $wpdb->get_row("select * from wp_w5bfvg74x5_postmeta where post_id='236' AND meta_key='1_dh_ptp_settings'");
$cdata= $wpdb->get_row("select * from wp_coupons where coupon_code='".$_REQUEST['os0']."' AND 	coupon_expire >='".date('Y-m-d')."' ");
$finaldata = unserialize($data->meta_value);

//print_r($finaldata);

/*foreach($finaldata['column'] as $key=>$val)
{
  $explodeplanname = explode("_",$package);
  if(strtolower($val['planname']) == strtolower($explodeplanname[0]))
  {
      $planprice = $val['planprice']; break;
         
  }
}*/

foreach($finaldata['column'] as $key=>$val)
{
  $planname=@explode('?package=',$val['buttonurl']);
  if(strtolower($planname[1]) == strtolower($package))
  { 
      $planprice = $val['planprice']; break;
         
  }
}


//echo $planprice;die;

if(!empty($cdata)){
    if($cdata->coupon_use > $cdata->coupon_used){
       $_SESSION['coupon_code']=$cdata->coupon_code;
       $planprice=str_replace("€","",$planprice);//str_replace("$","",$planprice);
       $planprice=$planprice*(100-$cdata->coupon_discount)/100;
       $planprice=number_format((float)$planprice, 2, '.', '');
       $planprice = "€".$planprice;
	   //$planprice=$planprice;
    }
}

/*if(!empty($cdata)){
    if($cdata->coupon_use > $cdata->coupon_used){
        $_SESSION['coupon_code']=$cdata->coupon_code;
        $planprice=$planprice*(100-$cdata->coupon_discount)/100;
        $planprice=number_format((float)$planprice, 2, '.', '');
        $planprice=$planprice;
     }
}*/

//echo $planprice;die;

function rand_line($fileName, $maxLineLength = 4096) {
    $handle = @fopen($fileName, "r");
    if ($handle) {
        $random_line = null;
        $line = null;
        $count = 0;
        while (($line = fgets($handle, $maxLineLength)) !== false) {
            $count++;
            // P(1/$count) probability of picking current line as random line
            if(rand() % $count == 0) {
              $random_line = $line;
            }
        }
        if (!feof($handle)) {
            echo "Error: unexpected fgets() fail\n";
            fclose($handle);
            return null;
        } else {
            fclose($handle);
        }
        return $random_line;
    }
}

$username_password = rand_line(trim($package).".txt");

if(trim($username_password) == "")
{
echo "<script>alert('Current plan is Out of stock.')</script>";
echo "<script>window.location.href='".site_url()."'</script>";
die;
}


if($planprice !="")
{
	$query = array();
    $query['notify_url'] = site_url().'/ipn.php';
    $query['cmd'] = '_cart';
    $query['upload'] = '1';
	$query['return'] = site_url().'/ipn.php';
	$query['currency_code'] = 'EUR';
    $query['business'] = 'cic0010@hotmail.com';
    $query['address_override'] = '1';
    $query['item_name_1'] = "Account Package ".$package;
	$query['item_number_1'] = $package;
    $query['quantity_1'] = '1';
    $query['amount_1'] = str_replace("€","",$planprice);//str_replace("$","",$planprice);
    $query_string = http_build_query($query);
    header('Location: https://www.paypal.com/cgi-bin/webscr?' . $query_string);
}	
	
?>