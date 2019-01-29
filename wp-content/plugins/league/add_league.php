
   <h2>Manage league</h2>
   <?php
   global $wpdb,$table_prefix;
   if(isset($_POST['action']) && $_POST['action']=="ulegue"){
	   $i=0;
	   $vleg='';
	   foreach($_POST['cleague1'] as $cleague1){
		   $vleg.='USD;'.$cleague1.';'.$_POST['division1'][$i].';'.$_POST['cleague2'][$i].';'.$_POST['division2'][$i].';'.$_POST['fixedprice'][$i].';'.$_POST['lp1'][$i].';'.$_POST['lp2'][$i].';'.$_POST['lp3'][$i].';'.$_POST['lp4'][$i].';'.$_POST['lp5'][$i].';0.00;0.00;0.00;0.00;0.00';
		   if($i!=25)
		   {
			   $vleg.='|';
		    }
		   $i++;
		   }
	   $wpdb->query("update ".$table_prefix."options set option_value='".$vleg."'  where  option_name='league_opt'");
	   
	   }
   
   $res=$wpdb->get_row("select option_value from ".$table_prefix."options where  option_name='league_opt'");
   
   $res1=explode('|',$res->option_value);
   $league=array();
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
    ?>
			<form name="feature_form" action="" method="post">
			<input type="hidden" name="action" value="ulegue" />
        <table cellspacing="0" cellpadding="0" border="1" style="width: 100%;" class="form-table">

    <tbody>
    <tr bgcolor="#ccc">
      <th style="padding:5px;">current League</th>
      <th style="padding:5px;">current Division</th>
      <th style="padding:5px;">Desired League</th>
      <th style="padding:5px;">desired division</th>
      <th style="padding:5px;">fixed price</th>
      <th style="padding:5px;"> lp <= 20</th>
      <th style="padding:5px;"> 20 < lp <=40 </th>
      <th style="padding:5px;"> 40 < lp <=60</th>
      <th style="padding:5px;"> 60 < lp <=80</th>
      <th style="padding:5px;"> 80 < lp <=100</th>
      
    </tr>
    
    <?php foreach($res1 as $row){
		$row1=explode(';',$row);
		
		?>
		
		
		  <tr>
      
      <td style="padding:5px;"><?php echo $league[$row1[1]];?><input type="hidden" name="cleague1[]" value="<?php echo $row1[1];?>" /></td>
      <td style="padding:5px;"><?php echo $divisionleg[$row1[2]];?><input type="hidden" name="division1[]" value="<?php echo $row1[2];?>" /></td>
     <td style="padding:5px;"><?php echo $league[$row1[3]];?><input type="hidden" name="cleague2[]" value="<?php echo $row1[3];?>" /></td>
      <td style="padding:5px;"><?php echo $divisionleg[$row1[4]];?><input type="hidden" name="division2[]" value="<?php echo $row1[4];?>" /></td>
      <td style="padding:5px;"><input type="number" value="<?php echo $row1[5];?>" name="fixedprice[]" /></td>
      <td style="padding:5px;"><input type="number" value="<?php echo $row1[6];?>" name="lp1[]" /></td>
       <td style="padding:5px;"><input type="number" value="<?php echo $row1[7];?>" name="lp2[]" /></td>
       <td style="padding:5px;"><input type="number" value="<?php echo $row1[8];?>" name="lp3[]" /></td>
       <td style="padding:5px;"><input type="number" value="<?php echo $row1[9];?>" name="lp4[]" /></td>
       <td style="padding:5px;"><input type="number" value="<?php echo $row1[10];?>" name="lp5[]" /></td>
    </tr>
		
		
		
		
		
		
		
		
		<?php 
		}?>
    
   
                        
                        </tbody>
        </table>
				<div class="inner_div" style="padding:5px;">
					<input type="submit" name="add_assign" id="add_assign" value="Update ">
				</div>
			</form>	
           