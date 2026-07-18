<?php
/** ปิดหน้า — ต้องตั้ง $pageScript (path ไปยังไฟล์ JS เฉพาะหน้า) ก่อน include */
?>
<script src="<?= htmlspecialchars(asset_url($pageScript)) ?>"></script>
</body>
</html>
