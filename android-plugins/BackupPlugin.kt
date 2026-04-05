package com.idxgaza.traneem

import android.content.Context
import android.os.Environment
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
import java.io.FileOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import kotlinx.coroutines.*

@CapacitorPlugin(name = "BackupPlugin")
class BackupPlugin : Plugin() {

    @PluginMethod
    fun createBackup(call: PluginCall) {
        val filesJson = call.getArray("files") ?: run {
            call.reject("No files provided")
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val downloadsDir = Environment.getExternalStoragePublicDirectory(
                    Environment.DIRECTORY_DOWNLOADS
                )
                val zipFile = File(downloadsDir, "traneem_backup_${System.currentTimeMillis()}.zip")
                
                ZipOutputStream(FileOutputStream(zipFile)).use { zos ->
                    for (i in 0 until filesJson.length()) {
                        val fileObj = filesJson.getJSONObject(i)
                        val name = fileObj.getString("name")
                        val path = fileObj.getString("path")
                        
                        val file = File(path)
                        if (file.exists()) {
                            zos.putNextEntry(ZipEntry(name))
                            file.inputStream().use { it.copyTo(zos) }
                            zos.closeEntry()
                        }
                    }
                }

                val result = JSObject()
                result.put("path", zipFile.absolutePath)
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("Backup failed: ${e.message}")
            }
        }
    }
